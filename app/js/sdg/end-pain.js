/*
////////////////////////////////////////////////////////////////////////////////
--------------------------------------------------------------------------------
SDG Custom Functions

    01. Run DOM Ready
	02. Cookies
	03. Debounce
	04. Get Query String
	05. Media Query
	06. Placeholder
	07. Lazy Load
	08. Modals
	09. Accordion
	10. Smooth Scroll
	11. Video
	12. Equal Height Objects
	13. Sticky
	14. Menus
	15. Newsletter Signup
	16. Mini Cart
	17. Input Incrementer
	18. Coupon
	19. Quick Add to Cart
    20. Extend Validation
    21. Extend Search Validation
    22. Functions to run on load

////////////////////////////////////////////////////////////////////////////////
--------------------------------------------------------------------------------
*/
(function($) {

	$.sdg = {};

	/*
	----------------------------------------------------------------------------
	01. Run DOM Ready
	----------------------------------------------------------------------------
	*/
	$.sdg.runDomReady = function() {

		var menus = new $.sdg.menus(),

		newsletterFooter = new $.sdg.newsletter(),

		modals = new $.sdg.modal();

		$.sdg.placeholder('.input-placeholder input');
		$.sdg.placeholder('.input-placeholder textarea');

	};

    /*
	----------------------------------------------------------------------------
	02. Cookies
	----------------------------------------------------------------------------
	*/
	$.sdg.setCookie = function(c_name,value,exdays) {
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) +
		((exdays===null) ? "" : ("; expires="+exdate.toUTCString()));
		document.cookie=c_name + "=" + c_value +"; path=/";
	};

	$.sdg.getCookie = function(c_name) {
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++) {
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x==c_name) {
				return unescape(y);
			}
		}
	};

	 /*
	----------------------------------------------------------------------------
	03. Debounce
	----------------------------------------------------------------------------
	*/
	$.sdg.debounce = function (func, threshold, execAsap) {

		var timeout;

		return function debounced () {
			var obj = this, args = arguments;

			function delayed () {
				if (!execAsap)
					func.apply(obj, args);
				timeout = null;
			}

			if (timeout)
				clearTimeout(timeout);
			else if (execAsap)
				func.apply(obj, args);

			timeout = setTimeout(delayed, threshold || 100);
		};

	};

    /*
	----------------------------------------------------------------------------
	04. Get Query String
	----------------------------------------------------------------------------
	*/
	$.sdg.queryString = (function(a) {
		if (a === "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i)
		{
			var p=a[i].split('=');
			if (p.length != 2) continue;
			b[p[0]] = decodeURIComponent(decodeURIComponent(decodeURIComponent(p[1].replace(/\+/g, " "))));
		}
		return b;
	})(window.location.search.substr(1).split('&'));

    /*
	----------------------------------------------------------------------------
	05. Media Query
	----------------------------------------------------------------------------
	*/
	$.sdg.mq = function(opts) {
		var config = {
			view	: null,
			callback : null,
			views : {
				small_phone 		: '(max-width:480px)',
				phone 				: '(max-width:767px)',
				mobile				: '(max-width:1024px)',
				tablet				: '(min-width:768px)',
				tablet_only 		: '(min-width:768px) and (max-width:1024px)',
				tablet_portrait 	: '(min-width:768px) and (max-width:979px)',
				tablet_landscape 	: '(min-width:980px) and (max-width:1024px)',
				desktop				: '(min-width:1025px)',
				desktop_large		: '(min-width:1281px)',
				desktop_huge		: '(min-width:1401px)'
			}
		},
		d = $.extend({},config,opts),
		mq = {
			init : function() {

				if (d.view) {

					var currentView = null;

					$.each(d.views,function(key,value) {
						if (key === d.view) {
							currentView = value;
						}
					});

					var query = Modernizr.mq(currentView);

					if (query) {
						d.callback();
					}

				}

			}
		};

		return mq.init();
	};


    /*
	----------------------------------------------------------------------------
	06. Placeholder
	----------------------------------------------------------------------------
	*/
	$.sdg.placeholder = function(target) {
		init = function() {
			valueHasChanged();

			$(target).each(function() {
				checkValue($(this));
			});
		};

		valueHasChanged = function() {
			$('body').on('change keyup',target,function() {
				checkValue($(this));
			});
		};

		checkValue = function(field) {
			if ($(field).val() !== '') {
				$(field).parent('.input-placeholder').addClass('has-value');
			} else {
				$(field).parent('.input-placeholder').removeClass('has-value');
			}
		};

		init();
	};

	/*
	----------------------------------------------------------------------------
	07. Lazy Load
	----------------------------------------------------------------------------
	*/
	$.sdg.lazyLoad = function(opts) {

		var config = {
			id				: null,
			single_selector 		: 'img.lazy',
			responsive				: false,
			responsive_selectors 	: ['phone','mobile','tablet','tablet_only','desktop'],
			threshhold 				: 300,
			responsive_refresh		: 500,
			loaded 					: 'loaded',
			loading     			: 'loading',
			loadCallBack 			: null,
			triggerOnLoad			: false
		},

		d = $.extend({},config,opts),

		unveiled = [],

		lazyLoad = {
			init : function() {
				if (d.responsive === true) {
					lazyLoad.runUnveil(d.single_selector);
					lazyLoad.responsiveInit();
					lazyLoad.responsiveResize();
				} else {
					lazyLoad.runUnveil(d.single_selector);
					if (d.triggerOnLoad === true) {
						lazyLoad.triggerOnLoad(d.single_selector);
					}
				}
			},
			responsiveInit : function() {

				var sizes = d.responsive_selectors,
				sizesArr = $.makeArray(sizes);

				if ($(sizesArr).not(unveiled).length !== 0) {

					$.each(sizes,function(index,value) {
						var size = value;

						$.sdg.mq({
							view : size,
							callback : function() {
								if ($.inArray(size,unveiled) === -1) {

									sizeClass = size;

									if (size == 'tablet_only') {
										sizeClass = 'tablet';
									}

									if (size == 'tablet') {
										sizeClass = 'desktop-and-tablet';
									}

									lazyLoad.runUnveil('.' + sizeClass + '-lazy');


									if (d.triggerOnLoad === true) {
										lazyLoad.triggerOnLoad('.' + sizeClass + '-lazy');
									}

									unveiled.push(sizeClass);

								}
							}
						});
					});
				}
			},
			runUnveil : function(obj) {

				var unveilObj = (d.id !== null ? d.id + ' ' : '') + obj;

				$(unveilObj).unveil(d.threshhold,function() {
					lazyLoad.unveilCallback($(this));
				});


			},
			unveilCallback : function(obj) {
				if (!obj.hasClass(d.loaded)) {
					obj.parent().addClass(d.loading);

					obj.load(function() {
						obj.css({opacity:1}).addClass(d.loaded);
						obj.addClass(d.loaded).parent().removeClass(d.loading);

						if (d.loadCallBack) {
							d.loadCallBack();
						}

					});
				}
			},
			responsiveResize : function() {
				$(window).on('resize',$.sdg.debounce(function() {
					lazyLoad.responsiveInit();
				},d.responsive_refresh));
			},
			triggerOnLoad : function(obj) {
				$(obj).trigger('unveil');
			}
		};

		return lazyLoad.init();

	};

	/*
	----------------------------------------------------------------------------
	08. Modals
	----------------------------------------------------------------------------
	*/
	$.sdg.modal = function(opts) {

		var config = {
			obj 			: '.modal',
			trigger		 	: '.modal__trigger',
			close 			: '.modal__close',
			visible 		: 'modal--visible',
			overlay 		: '.modal__overlay',
			overlay_visible : '.modal__overlay--visible',
			overflow		: 'overflow--hidden',
			timer 			: 250,
			closeCallback   : null,
			autoshow		: false,
			autoshow_delay  : 250
		},

		d = $.extend({},config,opts),

		modal = {
			init : function() {
				modal.triggerOpen();
				modal.triggerClose();
				modal.keyboard();

				if (d.autoshow === true) {

					setTimeout(function(){

						modal.open(d.obj);

					},d.autoshow_delay);

				}

			},

			triggerOpen : function() {

				$('body').on('click',d.trigger,function(e) {

					e.preventDefault();

					var modalToOpen = $(this).data('modal-open');

					modal.open(modalToOpen);

				});
			},

			open : function(el) {

				if (el.match("^#")) {
					el = el.replace('#','');
				}

				var modalClass = el + '-open';

				$('body').addClass(d.overflow + ' ' + modalClass);

				$('#' + el).addClass(d.visible)
				.next(d.overlay).addClass(d.visible);

			},

			close : function (el) {

				var modalClass;

				if (typeof el === 'object') {
					modalClass = el.attr('id') + '-open';
				} else {
					modalClass = el + '-open';
				}

				$(el).removeClass(d.visible)
				.next(d.overlay).removeClass(d.visible);

				setTimeout(function() {
					if (window.location.hash) window.location.hash = '';
					$('body').removeClass(d.overflow).removeClass(modalClass);

					if (d.closeCallback) {
						d.closeCallback();
					}

				},d.timer);

			},

			triggerClose : function() {

				$('body').on('click',d.close,function(e) {

					e.preventDefault();
					modal.close($('.' + d.visible));

				});

			},

			keyboard : function() {

				$(document).keyup(function(e) {

					if (e.keyCode == 27) {
						modal.close($('.' + d.visible));
					}

				});

			}
		};

		return {
			init : modal.init(),
			open : modal.open,
			close: modal.close
		};
	};


    /*
	----------------------------------------------------------------------------
	09. Accordion
	Notes:
	parentTrigger = the click object
	childContainer = the container you want to have slide open
	If you want a menu item open by default, add "open" to the child container.
	----------------------------------------------------------------------------
	*/
	$.sdg.accordion = function(opts) {

		var config = {
			id				: '#accordion',
			trigger 	 	: '.accordion__trigger',
			menu 		 	: '.accordion__content',
			scroll_scope 	: 'html,body',
			scroll_offset   : 60,
			active			: 'active',
			menu_open		: 'open',
			timer			: 350,
			type			: 'accordion'
		},

		d = $.extend({},config,opts),

		accordion = {

			init : function() {

				accordion.toggle();

			},

			toggle : function() {

				$(d.id).on('click',d.trigger,function() {

					accordion.state($(this));

				});

			},

			state : function(obj) {

				if (obj.hasClass(d.active)) {

					if (d.type === 'accordion') {

						accordion.focusViewport($(d.id),0);

					}

					accordion.close();

				} else {

					accordion.focusViewport(obj);

					accordion.open(obj);

				}

			},

			open : function(obj) {

				if (d.type === 'accordion') {
					accordion.close();
				}

				obj.addClass(d.active);

				obj.next(d.menu)
				.addClass(d.menu_open)
				.slideDown(d.timer);

			},

			close : function(obj) {

				if (obj) {
					obj.removeClass(d.active)
					.next(d.menu)
					.removeClass(d.menu_open)
					.slideUp(d.timer);
				} else {
					$(d.id).find('.' + d.active)
					.removeClass(d.active)
					.next(d.menu)
					.removeClass(d.menu_open)
					.slideUp(d.timer);
				}

			},

			focusViewport : function(obj,pos) {

				if (d.scroll_scope) {

					setTimeout(function() {

						var offset;
						if (d.scroll_offset) {
							offset = ($(d.scroll_scope).scrollTop() + obj.position().top) - d.scroll_offset;
						} else {
							offset = $(d.scroll_scope).scrollTop() + obj.position().top;
