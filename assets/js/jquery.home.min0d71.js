(
	function( $ ) {
		'use strict';

		var showPopup = false;

		var tooltipTriggerList = [].slice.call( document.querySelectorAll( '[data-bs-toggle="tooltip"]' ) )
		var tooltipList = tooltipTriggerList.map( function( tooltipTriggerEl ) {
			return new bootstrap.Tooltip( tooltipTriggerEl )
		} )
		function wdwidth() {
			var wdwidth = window.innerWidth ||
				document.documentElement.clientWidth ||
				document.body.clientWidth ||
				document.body.offsetWidth;
			return wdwidth;
		}
		$( document ).ready( function( $ ) {
			if (wdwidth() < 992) {
				$('.nav a').click(function () {
					console.log(wdwidth());
					$('.navbar-toggler').toggleClass('collapsed');
					$('.menu_scr').toggleClass('show');
				});
			}
			$( '#product-slider' ).slick( {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: true,
				fade: true,
				cssEase: 'linear',
				adaptiveHeight: true,
				asNavFor: '#product-slider-sync'
			} );

			$( '#product-slider-sync' ).slick( {
				slidesToShow: 5,
				slidesToScroll: 1,
				asNavFor: '#product-slider',
				dots: false,
				arrows: true,
				centerMode: false,
				focusOnSelect: true,
				responsive: [
					{
						breakpoint: 600,
						settings: {
							slidesToShow: 3,
							slidesToScroll: 1,
							infinite: false,
						}
					}, {
						breakpoint: 480,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 1,
							infinite: false,
						}
					}
				]
			} );
			$( '#advisors-slider' ).slick( {
				slidesToShow: 3,
				slidesToScroll: 1,
				dots: false,
				responsive: [
					{
						breakpoint: 1280,
						settings: {
							slidesToShow: 3,
							slidesToScroll: 1,
							infinite: true,
						}
					}, {
						breakpoint: 981,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 1,
							infinite: true,
						}
					}, {
						breakpoint: 767,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 1
						}
					}, {
						breakpoint: 600,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1
						}
					}
				]
			} );
			$( '#news-slider' ).slick( {
				slidesToShow: 3,
				slidesToScroll: 1,
				dots: false,
				responsive: [
					{
						breakpoint: 1280,
						settings: {
							slidesToShow: 3,
							slidesToScroll: 1,
							infinite: true,
						}
					}, {
						breakpoint: 981,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 1,
							infinite: true,
						}
					}, {
						breakpoint: 767,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 1
						}
					}, {
						breakpoint: 600,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1
						}
					}
				]
			} );
			$( window ).on( 'scroll', function() {
				var scroll_pos = $( window ).scrollTop()
				if ( scroll_pos > 88 ) {
					$( '#header' ).addClass( 'fixed' );
				} else {
					$( '#header' ).removeClass( 'fixed' );
				}
			} );

			var $advertiseModal = $( '#advertise-modal' );
			$advertiseModal.on( 'click', '.btn-modal-close', function( evt ) {
				$advertiseModal.modal( 'hide' );
			} );

			initSplitNavHeader();

			function initSplitNavHeader() {
				var $header = $( '#header' );
				var $navigation = $header.find( '#primary-menu' ),
				    $navItems   = $navigation.find( '.nav > li' ),
				    itemsNumber = $navItems.length,
				    rtl         = false,
				    midIndex    = parseInt( itemsNumber / 2 + .5 * rtl - .5 ),
				    $midItem    = $navItems.eq( midIndex ),
				    $logo       = $header.find( '.site-branding' ),
				    logoWidth,
				    leftWidth   = 0,
				    rule        = rtl ? 'marginLeft' : 'marginRight',
				    rightWidth  = 0;

				var recalc = function() {
					logoWidth = $logo.outerWidth();
					leftWidth = 0;
					rightWidth = 0;

					for ( var i = itemsNumber - 1; i >= 0; i -- ) {
						var itemWidth = $navItems.eq( i ).outerWidth();

						if ( i > midIndex ) {
							rightWidth += itemWidth;
						} else {
							leftWidth += itemWidth;
						}
					}

					var diff = leftWidth - rightWidth;

					if ( rtl ) {
						if ( leftWidth > rightWidth ) {
							$navigation.find( '.nav > li:first-child' ).css( 'marginRight', - diff );
						} else {
							$navigation.find( '.nav > li:last-child' ).css( 'marginLeft', diff );
						}
					} else {
						if ( leftWidth > rightWidth ) {
							$navigation.find( '.nav > li:last-child' ).css( 'marginRight', diff );
						} else {
							$navigation.find( '.nav > li:first-child' ).css( 'marginLeft', - diff );
						}
					}

					$midItem.css( rule, logoWidth + 72 );
				};

				recalc();
				$navigation.addClass( 'menu-calculated' );

				$( window ).on( 'resize', recalc );
			}
		} );

		$( window ).on( 'load', function() {
			if ( showPopup ) {
				var $advertiseModal = $( '#advertise-modal' );

				$advertiseModal.modal( 'show' );
			}
		} );

		let tokenomicsChart = echarts.init( document.getElementById( 'tokenomicsChart' ), 'macarons' );

		function autoFontSize() {
			let width = document.getElementById( 'tokenomicsChart' ).offsetWidth;
			let newFontSize = Math.round( width / 60 );
			/*console.log( `Current width : ${width}, Updating Fontsize to ${newFontSize}` );*/
			return newFontSize;
		}

		var option = {
			title: {
				text: '',
				subtext: '',
				x: 'center'
			},
			tooltip: {
				trigger: 'item',
				formatter: function( params ) {
					return `${params.name}: ${params.percent}%${params.data.desc}`
				}
			},
			toolbox: {
				show: ! 1,
				feature: {
					saveAsImage: {
						show: ! 0
					}
				}
			},
			series: [
				{
					name: 'Tokenomics',
					type: 'pie',
					radius: [ '30%', '60%' ],
					center: [ '50%', '50%' ],
					data: [
						{
							value: 3,
							name: 'Seed sale',
							desc: '<br />5% at TGE<br />Lock for 3 months<br/>Linear vesting for 20 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#942567'
											},
											{
												offset: 1,
												color: '#CF3E58'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#ff5271',
								},
							}
						}, {
							value: 10,
							name: 'Private sale',
							desc: '<br />10% at TGE<br/>Lock for 3 months<br/>Linear vesting for 18 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#09ACFD'
											},
											{
												offset: 1,
												color: '#4FBAF0'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#02ADDA',
								},
							}
						}, {
							value: 2,
							name: 'Public Sale',
							desc: '<br />20% at TGE<br/>Linear vesting for 4 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#5158CA'
											},
											{
												offset: 1,
												color: '#8E91FA'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#849eff',
								},
							}
						}, {
							value: 20,
							name: 'Team',
							desc: '<br />Lock for 12 months<br/>Linear vesting for 24 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#FF974B'
											},
											{
												offset: 1,
												color: '#FE4688'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#ff8252',
								},
							}
						}, {
							value: 3,
							name: 'Advisor',
							desc: '<br />Lock for 12 months<br />Linear vesting for 24 months'
						}, {
							value: 4,
							name: 'Liquidity',
							desc: '',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#F554B5'
											},
											{
												offset: 1,
												color: '#A812DD'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#e555ff',
								},
							}
						}, {
							value: 8,
							name: 'Marketing',
							desc: '<br />2% at TGE<br />Lock for 1 month<br />Linear vesting for 24 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#99FFA3'
											},
											{
												offset: 1,
												color: '#68EE76'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#6EF07B',
								},
							}
						}, {
							value: 40,
							name: 'Game & Staking',
							desc: '<br />Linear vesting for 20 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#FFD572'
											},
											{
												offset: 1,
												color: '#F1A200'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#F4AD1A',
								},
							}
						}, {
							value: 10,
							name: 'Reserves ',
							desc: '<br />Lock for 12 months<br />Linear vesting for 18 months',
							itemStyle: {
								normal: {
									color: new echarts.graphic.LinearGradient(
										0, 0, 0, 1,
										[
											{
												offset: 0,
												color: '#ff77c2'
											},
											{
												offset: 1,
												color: '#ff1897'
											}
										]
									)
								},
							},
							label: {
								textStyle: {
									color: '#ff77c2',
								},
							}
						}
					],
					label: {
						textStyle: {
							fontFamily: 'Oxanium',
							fontSize: autoFontSize(),
							fontWeight: '600'
						},
						formatter: function( params ) {
							return `${params.name} ${params.percent}%`
						}
					},
					itemStyle: {
						borderColor: '#020c21',
						borderWidth: 4,
						emphasis: {
							shadowBlur: 0,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0)'
						}
					}
				}
			]
		};

		tokenomicsChart.setOption( option );

		$( window ).on( 'resize', function() {
			if ( tokenomicsChart != null && tokenomicsChart != undefined ) {
				tokenomicsChart.resize( {
					width: 'auto',
					height: 'auto'
				} );
				tokenomicsChart.setOption( {
					series: {
						label: {
							textStyle: {
								fontSize: autoFontSize()
							}
						}
					}
				} )
			}
		} );
	}( jQuery )
);
