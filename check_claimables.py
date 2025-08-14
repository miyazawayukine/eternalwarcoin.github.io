#!/usr/bin/env python3
import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

import requests
from web3 import Web3
from web3.types import TxParams


ETH_PUBLIC_RPC = os.environ.get("ETH_RPC_URL", "https://eth.llamarpc.com")
ETHERSCAN_API_KEY = os.environ.get("ETHERSCAN_API_KEY", "")
ETHERSCAN_BASE = os.environ.get("ETHERSCAN_BASE", "https://api.etherscan.io/api")


def is_valid_address(address: str) -> bool:
	try:
		Web3.to_checksum_address(address)
		return True
	except Exception:
		return False


def to_checksum(address: str) -> str:
	return Web3.to_checksum_address(address)


def make_web3(rpc_url: str) -> Web3:
	w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 20}))
	if not w3.is_connected():
		raise RuntimeError(f"Failed to connect to RPC: {rpc_url}")
	return w3


def is_contract_address(w3: Web3, address: str) -> bool:
	code = w3.eth.get_code(to_checksum(address))
	return len(code) > 0


def fetch_etherscan_abi(contract_address: str) -> Optional[List[Dict[str, Any]]]:
	if not ETHERSCAN_API_KEY:
		return None
	params = {
		"module": "contract",
		"action": "getabi",
		"address": contract_address,
		"apikey": ETHERSCAN_API_KEY,
	}
	try:
		resp = requests.get(ETHERSCAN_BASE, params=params, timeout=20)
		resp.raise_for_status()
		data = resp.json()
		if data.get("status") == "1":
			abi_json = json.loads(data.get("result", "[]"))
			return abi_json
		return None
	except Exception:
		return None


COMMON_CLAIMABLE_KEYWORDS = [
	"claimable",
	"releasable",
	"pending",
	"earned",
	"unclaimed",
	"withdrawable",
	"vested",
	"available",
]


def is_potential_claimable_function(fn_abi: Dict[str, Any]) -> bool:
	if fn_abi.get("type") != "function":
		return False
	state = fn_abi.get("stateMutability")
	is_constant = bool(fn_abi.get("constant"))
	is_view_like = (state in ("view", "pure")) or is_constant
	if not is_view_like:
		return False
	name = fn_abi.get("name", "").lower()
	if not any(k in name for k in COMMON_CLAIMABLE_KEYWORDS):
		return False
	# Must return something numeric-like (uint*/int*) or a tuple containing those
	outputs = fn_abi.get("outputs", [])
	if not outputs:
		return False
	for out in outputs:
		out_type = (out.get("type") or "").lower()
		if out_type.startswith("uint") or out_type.startswith("int"):
			return True
		if out_type == "tuple" and out.get("components"):
			# Consider tuple claimable if it has at least one numeric component
			for comp in out["components"]:
				ctype = (comp.get("type") or "").lower()
				if ctype.startswith("uint") or ctype.startswith("int"):
					return True
	return False


def build_call_args_for_function(fn_abi: Dict[str, Any], wallet: str, token: Optional[str]) -> Optional[List[Any]]:
	inputs = fn_abi.get("inputs", [])
	if not inputs:
		return []
	# If all inputs are address types, try to map heuristically
	all_address = all((inp.get("type", "").lower() == "address") for inp in inputs)
	if all_address:
		args: List[Any] = []
		for inp in inputs:
			iname = (inp.get("name") or "").lower()
			if "token" in iname or iname in ("asset", "rewardtoken"):
				if token:
					args.append(to_checksum(token))
				else:
					return None
			else:
				# assume account/recipient/user
				args.append(to_checksum(wallet))
		return args
	# Some functions expect (address, uint256) or similar; skip to avoid bad calls
	return None


def decode_numeric(value: Any) -> Optional[int]:
	try:
		# web3 returns int for uint256; handle tuples as well
		if isinstance(value, int):
			return value
		if isinstance(value, (list, tuple)):
			for v in value:
				if isinstance(v, int):
					return v
		return None
	except Exception:
		return None


def try_contract_claimables(
	w3: Web3,
	contract_address: str,
	wallet: str,
	token: Optional[str] = None,
	abi: Optional[List[Dict[str, Any]]] = None,
) -> List[Tuple[str, int]]:
	if abi is None:
		abi = fetch_etherscan_abi(contract_address)
	if not abi:
		return []
	contract = w3.eth.contract(address=to_checksum(contract_address), abi=abi)
	results: List[Tuple[str, int]] = []
	for fn in abi:
		if not is_potential_claimable_function(fn):
			continue
		fn_name = fn.get("name")
		try:
			args = build_call_args_for_function(fn, wallet, token)
			if args is None:
				continue
			func = contract.get_function_by_name(fn_name)
			call_params: TxParams = {"from": to_checksum(wallet)}
			ret = func(*args).call(call_params)
			num = decode_numeric(ret)
			if num is not None and num > 0:
				results.append((fn_name, num))
		except Exception:
			# Ignore functions that fail
			continue
	return results


def format_wei_amount(w3: Web3, amount: int, decimals: int = 18) -> str:
	if decimals <= 0:
		return str(amount)
	return f"{amount / (10 ** decimals):.6f}"


def detect_erc20_decimals(w3: Web3, token_address: Optional[str]) -> int:
	if not token_address:
		return 18
	try:
		abi = [
			{
				"constant": True,
				"inputs": [],
				"name": "decimals",
				"outputs": [{"name": "", "type": "uint8"}],
				"stateMutability": "view",
				"type": "function",
			}
		]
		contract = w3.eth.contract(address=to_checksum(token_address), abi=abi)
		return int(contract.functions.decimals().call())
	except Exception:
		return 18


def try_aggregators(wallet: str) -> List[Dict[str, Any]]:
	"""Placeholder for optional aggregator integrations (Zerion/Zapper/DeBank).
	Returns a list of claimable items if available. Currently returns empty list.
	"""
	items: List[Dict[str, Any]] = []
	# Implementations can be added here using API keys from env vars
	# Example envs: ZERION_API_KEY, ZAPPER_API_KEY, DEBANK_API_KEY
	return items


def main() -> None:
	parser = argparse.ArgumentParser(
		description=(
			"Check if an Ethereum address has claimable tokens.\n"
			"Use --contract to check a specific contract's claimable(view) functions for the given wallet.\n"
			"You can provide ABI via --abi to avoid relying on Etherscan."
		)
	)
	parser.add_argument("wallet", help="Wallet address to check (EOA)")
	parser.add_argument("--contract", dest="contract", help="Specific contract address to query claimable functions", default=None)
	parser.add_argument("--token", dest="token", help="Optional token address when contract function requires it", default=None)
	parser.add_argument("--abi", dest="abi", help="ABI file path or raw JSON string for --contract", default=None)
	parser.add_argument("--rpc", dest="rpc", help=f"Ethereum RPC URL (default: {ETH_PUBLIC_RPC})", default=ETH_PUBLIC_RPC)
	args = parser.parse_args()

	wallet = args.wallet.strip()
	if not is_valid_address(wallet):
		print("Error: invalid wallet address")
		sys.exit(2)

	w3 = make_web3(args.rpc)

	# Optional aggregator discovery
	aggregated = try_aggregators(wallet)
	if aggregated:
		print("Claimables from aggregators:")
		for item in aggregated:
			print(json.dumps(item, ensure_ascii=False))
	else:
		print("No aggregator results or aggregators not configured.")

	if args.contract:
		contract = args.contract.strip()
		if not is_valid_address(contract):
			print("Error: invalid --contract address")
			sys.exit(2)
		if not is_contract_address(w3, contract):
			print("Warning: --contract is not a contract on-chain (no code detected)")
		token = args.token.strip() if args.token else None
		if token and not is_valid_address(token):
			print("Error: invalid --token address")
			sys.exit(2)

		abi: Optional[List[Dict[str, Any]]] = None
		if args.abi:
			# Try to load from file or parse JSON string
			candidate = args.abi
			try:
				if os.path.isfile(candidate):
					with open(candidate, "r", encoding="utf-8") as f:
						abi = json.load(f)
				else:
					abi = json.loads(candidate)
			except Exception as e:
				print(f"Error: failed to load ABI from --abi ({e}).")
				abi = None

		if abi is None:
			abi = fetch_etherscan_abi(contract)
		if not abi:
			print("Note: No ABI available (provide --abi or set ETHERSCAN_API_KEY).")
			print("Result: 0 claimables detected (ABI missing).")
			sys.exit(0)

		claimables = try_contract_claimables(w3, contract, wallet, token, abi)
		if not claimables:
			print("Result: No claimable amounts detected via contract view functions.")
			return
		decimals = detect_erc20_decimals(w3, token)
		print("Potential claimables (function => amount):")
		for fn_name, amount in claimables:
			print(f"- {fn_name}: {amount} (approx {format_wei_amount(w3, amount, decimals)} with decimals={decimals})")
		return

	print(
		"Tip: Provide --contract <address> (and optionally --token <address> and --abi <ABI>) to query a specific claimable view function."
	)


if __name__ == "__main__":
	main()