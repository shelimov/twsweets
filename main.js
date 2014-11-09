console.time("tws");
(function(global) {

	/*
		Fixes: 
			Некорректно работает меню справа. Пофикси selectBox.

		1. Сделать Notifications класс для одноразовых Notify
		   Для постоянных Notify

		2. Как насчет расширение чата через добавление видосиков с YouTube?
		3. Попробуй помутить переодевалку

		4. DeluxeJobs:
		4.1 Наборы работ
		4.2 Предустановленные наборы на дежавю

		5. DuelSafer добавь справку, улучши окно предупреждения.
		6. WIR пофикси при поиске снизу листинг, при предметах больше 1к корректное отображние,
		   Избранные предметы. Можно еще расширить весь инвентарь.
	*/
	var global = window // temp

	'use strict';
	
	var SCRIPT_VERSION = 1.2,
		SCRIPT_LANGUAGE = "en";

	function each(input, output) {
		if (input instanceof Array)
			for (var i = 0, l = input.length; i < l; i++)
				output(input[i], i);
		else
			for (var key in input)
				if (input.hasOwnProperty(key))
					output(input[key], key);
	}

	function extend(to, from) {
		each(from, function(el, key) {
			to[key] = el;
		});

		return to;
	}
	function softExtend(to, from) {
		each(from, function(el, key) {
			if (to[key] === undefined)
				to[key] = el;
		});
	}

	function linkToObject(to, from) {
		each(from, function(fn, index) {
			to[fn.name] = fn;
		});
	}

	function isType(input, type) {
		return typeof input == type;
	}

	function isDef(input) {
		return input !== undefined;
	}

	function eventsChain() {
		var events = {};
		this.push = function(event, fn, context, data) {
			if (!events[event])
				events[event] = [];

			events[event].push({
				f: fn,
				c: context,
				d: data
			});
		}
		this.call = function(event, data) {
			if (!events[event])
				return;

			data = data || [];

			each(events[event], function(obj) {
				obj.d = obj.d || [];
				obj.f.apply(obj.c, obj.d.concat(data));
			});
		}
		this.remove = function(event, fn) {
			each(events[event], function(obj, name) {
				if (obj.f == fn)
					delete events[event][name];
			});
		}
	}

	function wrap(fn) {
		return function() {
			return fn.apply(this, arguments);
		}
	}

	function getWholeADom() {
		var tmp = document.createDocumentFragment();
		each(this, function(fn) {
			if (fn != getWholeADom) {
				var n = fn();
				tmp.appendChild(n[0] || n);
			}
		});
		return tmp;
	}

	// Factory define, require nothing, only native;
	var Factory = (function() {
		function TWSFactoryInstance() {
			var data = {};
			this.data = function() {
				var l = arguments.length;
				if (l == 0)
					return data;
				if (l == 1)
					if (typeof arguments[0] == 'string')
						return data[arguments[0]];
					else
						extend(data, arguments[0]);
				if (l == 2)
					return data[arguments[0]] = arguments[1];
			}
		}
		function TWSClass() {}
		function Factory() {
			// make instance and return it
			var factoryInstance = new TWSFactoryInstance(),
				args = arguments;
			// adds result object and factoryinstance link for the future
			factoryInstance.data({
				_result: new TWSClass(),
				_fi: factoryInstance
			});

			// call all init methods
			each(Factory.fn.FactoryMethods._initChain, function(fn) {
				fn.apply(factoryInstance, args);
			})
			return factoryInstance;
		}
		Factory.fn = {};
		Factory.fn.FactoryMethods = { _initChain: []};
		TWSFactoryInstance.prototype = Factory.fn.FactoryMethods;
		TWSFactoryInstance.prototype.constructor = TWSFactoryInstance;

		return Factory;
	})();

	// Define TWS.Initializer
	// We need it to call functions only when the other part of API loaded.
	global.TWS = {};
	TWS.Initializer = new function() {
		var that = this,
			stack = {};
			// return true if scope defined or function returns true
			function checkScope(str) {
				var parts = str.split('.'),
					scope = global;
				for (var i = 0, l = parts.length, p; i < l; i++) {
					p = parts[i];
					var f = p.match(/\((.*)\)/);
					if (f) {
						p = p.replace(f[0], "");
						if (scope[p]) {
							scope = scope[p].apply(scope, f[1].split(','));
							if (!scope)
								return false;
						}
						else
							return false;
					} else {
						if ((scope = scope[p]) === undefined)
							return false;
					}
				};
				return true;
			}
		this.initAfter = function(after, init, timer, context, data) {
			timer = timer || 300;
			function _try() {
				for (var i = 0, l = after.length; i < l; i++) {
					var el = after[i];
					if (typeof el === 'function') {
						if (!el())
							return setTimeout(_try, timer);
					} else {
						if (!checkScope(el))
							return setTimeout(_try, timer);
					}
				}
				init.apply(context, data);
			};
			_try();
		};
		this.addChain = function(chain, name) {
			var loaded = false;
			stack[name] = [];
			this[name] = function(fn, c, d) {
				if (loaded)
					fn.apply(c, d);
				else {
					stack[name].push({
						f: fn,
						context: c,
						data: d
					});
				}
			};
			function onLoad() {
				loaded = true;
				each(stack[name], function(el) {
					el.f.apply(el.context, el.data);
				});
			}
			this.initAfter(chain, onLoad);
		}
	};

	(function(fns) {

		fns.ControlMethods = {
			getData: function() {
				return this.data('data');
			},
			getDesc: function() {
				return this.data('desc');
			},
			langPack: function(el) {
				return this.data('langpack')[el];
			},
			getOriginal: function() {
				return this.data('_result');
			},
			getFactory: function() {
				return this;
			},
			throwError: function(msg) {
				var a = new Error(msg);
				a.name = this.data('desc').ns;
				throw a;

				return false;
			}
		}

		function ControlMethodsTunnel(name, args) {
			return fns.ControlMethods[name].apply(this, Array.prototype.slice.call(arguments, 1));
		}

		fns.FactoryMethods._initChain.push(function(namespace, instance) {
			this.data({
				langpack: {},
				callstacks: {gui: [], instance: []},
				desc: { ns: namespace },
				data: {},
				inited: false
			});

			this.extend(instance);

		});

		TWS.Initializer.addChain(["Game.loaded", "EventHandler.listen", "west.createClass"], "apiLoaded");

		extend(fns.FactoryMethods, {
			addData: function(obj) {
				var d = this.data();
				extend(d.data, obj);
				return this;
			},
			extend: function(input) {
				var d = this.data();

				if (typeof input == "object")
					extend(d._result, input);
				else
					if (d.inited)
						this._initInstance(input);
					else
						d.callstacks.instance.push(input);

				return this;
			},
			addGui: function(input) {
				var d = this.data(),
					self = d._result;

				self.Gui = self.Gui || {};
				if (typeof input == "object")
					extend(self.Gui, input);
				else
					if (d.inited)
						this._initGui(input);
					else
						d.callstacks.gui.push(input);

				return this;
			},
			_initGui: function(input) {
				var self = this.data('_result'),
					tmp = input.call(self.Gui, self, ControlMethodsTunnel.bind(this));
				if (typeof tmp === "object")
					extend(self.Gui, tmp)
			},
			_initInstance: function(input) {
				var self = this.data('_result'),
					tmp = input.call(self, ControlMethodsTunnel.bind(this));
				if (typeof tmp === "object")
					extend(self, tmp);	
			},
			addLangpack: function(obj) {
				var d = this.data();

				d.langpack = d.langpack || {}
				extend(d.langpack, obj);

				return this;
			},
			setDescription: function(obj) {
				var d = this.data();

				extend(d.desc, obj);

				return this;
			},
			makeOnApiLoad: function() {
				var self = this;

				TWS.Initializer.apiLoaded(function() {
					self.make();
				});
			},
			makeOnGameLoad: function() {
				var self = this;
				window.addEventListener("load", function load() {
					window.removeEventListener("load", load, false);
					self.make();
				}, false);
			},
			makeOn: function(after, timeout) {
				var self = this;
				TWS.Initializer.initAfter(after, function() {
					self.make();
				}, timeout);
			},
			make: function() {
				var d = this.data(),
					that = this,
					self = d._result,
					parts = d.desc.ns.split('.'),
		            scope = global,
		            i, len = parts.length;

				each(d.callstacks.gui, function(fn) {
					that._initGui(fn);
				});

				each(d.callstacks.instance, function(fn) {
					that._initInstance(fn);
				});

		        if (!parts[0])
		        	parts[0] = "TWS";

				for (i = 0; i < len; i++) {
					var p = parts[i];
					if (i == len - 1) {
						if (scope[p])
							extend(scope[p], self);
						else
							scope[p] = self;
					} else {
						scope = scope[p] = scope[p] || {};
					}
				}

				if (self.init)
					self.init();
				if (self.Gui && self.Gui.init)
					self.Gui.init();

				d.inited = true;
	

				return self;
			}
		});
	})(Factory.fn);

	Factory('.Storage', function(methods) {
		var data = methods("getData").settings;

		this.init = function() {
			var self = this;
			Factory.fn.FactoryMethods.defaultSettings = function(obj, namespace) {
				namespace = namespace || this.data("desc").ns;
				namespace[0] == '.' && namespace.slice(1);
				self.setDefault(obj, namespace);
				return this;
			}
		}
		this.set = function(key, value, namespace) {
			namespace = namespace || "common";
			data[namespace] = data[namespace] || {};
			data[namespace][key] = value;
			localStorage.setItem("TWSweets", JSON.stringify(data));
		}
		this.get = function(key, namespace) {
			namespace = namespace || "common";
			return this.isExist(key, namespace) ? (key ? data[namespace][key] : data[namespace]) : null;
		}
		this.isExist = function(key, namespace) {
			namespace = namespace || "common";
			return data[namespace] && (key && isDef(data[namespace][key]) || true);
		}
		this.setDefault = function(obj, namespace) {
			data[namespace] = data[namespace] || {};
			softExtend(data[namespace], obj);
			localStorage.setItem("TWSweets", JSON.stringify(data));
		}
	}).addData({
		settings: JSON.parse(localStorage.getItem('TWSweets')) || {}
	}).make();

	Factory('.CSS', function() {
		var css = document.createElement("style"),
			that = this,
			samples = {};
		document.getElementsByTagName("head")[0].appendChild(css);

		function update(from, to) {
			css.innerHTML = css.innerHTML.replace(from, to);
		}

		Factory.fn.FactoryMethods.addCss = function(css) {
			that.append(this.data("desc").ns, css);

			return this;
		}

		this.append = function(sample, code) {
			if (samples[sample])
				update(samples[sample], samples[sample] = samples[sample] + '\n' + code);
			else
				css.innerHTML += samples[sample] = code;
		}

		this.remove = function(sample) {
			update(samples[sample], "");
			delete samples[sample];
		}
	}).make();

	Factory('TWS', {
		Info: {
			version: SCRIPT_VERSION,
			author: "Shelimov",
			author_player: "Abstract",
			website: "http://tws.shelimov.me/"
		},
		Factory: Factory
	}).addGui(function(main, control) {
		var that = this,
			Class = west.createClass;

		this.eventedComponent = Class(west.gui.Component, {
			init: function() {
				this.eventsChain = new eventsChain();
			},
			addEventListener: function(event, fn, ctx, data) {
				this.eventsChain.push.apply(this, arguments);
				return this;
			},
			removeEventListener: function(event, fn) {
				this.eventsChain.remove.apply(this, arguments);
				return this;
			}
		});
		this.Window = Class(west.gui.Window, {
			init: function(id, title, classes, minititle) {
				this.isVisible = false;
				this.title = title;
				var w = wman.open(id, title, classes);
				//this.hide = wrap(this.hide).bind(this);
				w.destroy = this.hide;

				for (var i in w)
					if (w.hasOwnProperty(i))
						this[i] = w[i];

				if (minititle) {
					this.originalMiniTitle = minititle;
					this.setMiniTitle(minititle);
				}

				this._writeListeners();
				WestUi.WindowBar.onWindowDestroy(this.id);
				this.divMain.style.visibility = 'hidden';
				this.divMain.style.display = 'none';
			},
			_writeListeners: function() {
				var self = this;
				this.eventListeners.WINDOW_CLOSE = [];
				this.addEventListener('WINDOW_CLOSE', function() {
					self.hide();
				});
			},
			addTab: function(tab) {
				if (!(tab instanceof that.WindowTab))
					return control("throwError", "arguments aren't instanceof WindowTab")

				var tabId = tab.getId(),
					self = this;

				if (this.tabIds[tabId])
					return control("throwError", "tab already defined");

				this._super.prototype.addTab.call(this, tab.getName(), tabId, function() {
					self.open(tabId);
				});
				this.tabIds[tabId]["tabObject"] = tab;
				this.appendToContentPane(tab.getMainDiv());
			},
			openTab: function(tabId) {
				if (!this.tabIds[tabId])
					return control("throwError", "tab doesn't exist");

				var tabObject = this.tabIds[tabId].tabObject;
				each(this.tabIds, function(tab, tid) {
					if (tid != tabId)
						tab.tabObject.hide();
					else
						tab.tabObject.show();
				});

				this.activateTab(tabId);

				// set titles
				if (tabObject.miniTitle)
					this.setMiniTitle(this.originalMiniTitle + ": " + tabObject.miniTitle);
				else
					this.setMiniTitle(this.originalMiniTitle);

				if (tabObject.title)
					this.setTitle(tabObject.title);
				else
					this.setTitle(this.title);
			},
			open: function(tabId) {
				if (tabId)
					this.openTab(tabId);

				if (this.isVisible)
					return;

			    document.getElementById('windows').appendChild(this.divMain);
				if (Config.get('gui.main.animations')) {
					this.divMain.style.visibility = 'visible';
					this.divMain.style.display = 'none';
			        $(this.divMain).fadeIn('fast')
			    } else {
			    	this.divMain.style.display = 'block';
			    	this.divMain.style.visibility = 'visible';
			    }

				
				WestUi.WindowBar.onWindowOpen(this.id, this);

				this.isVisible = true;
			
			},
			hide: function() {
				var divMain = this.divMain;
				if (!this.isVisible)
					return;

				if (Config.get("gui.main.animations")) {
			        $(divMain).slideUp(function() {
			            divMain.parentNode.removeChild(divMain);
		        		divMain.style.display = "none";
			        });
			    } else {
			        divMain.parentNode.removeChild(divMain);
			        divMain.style.display = "none";
			    }

				WestUi.WindowBar.onWindowDestroy(this.id);
				this.isVisible = false;
			}
		});
		this.WindowTab = Class(this.eventedComponent, {
			init: function(tabName, tabId) {
				this.callParent();
				this.divMain = $('<div>');
				this.isVisible = false;
				this.tabName = tabName;
				this.divMain.hide();

				if (tabId)
					this.setId(tabId);
			},
			append: function(content) {
				this.divMain.append(content);
				return this;
			},
			show: function() {
				if (this.isVisible)
					return;

				if (Config.get("gui.main.animations"))
					this.divMain.fadeIn();
				else
					this.divMain.show()

				this.eventsChain.call("open");
				this.isVisible = true;
				return this;
			},
			hide: function() {
				if (!this.isVisible)
					return;

				this.divMain.hide();
				this.eventsChain.call("close");
				this.isVisible = false;
				return this;
			},
			setTitle: function(txt) {
				this.title = txt;
				return this;
			},
			setMiniTitle: function(txt) {
				this.miniTitle = txt;
				return this;
			},
			getName: function() {
				return this.tabName;
			},
			setId: function(id) {
				this.tabId = id;
				this.divMain.attr('id', id);
				return this;
			},
			getId: function() {
				return this.tabId;
			}
		});
		this.MenuIcon = Class(west.gui.Component, {
			init: function(icon, imagehoverable) {
				this.iconDiv = $('<div class="tws_mi_icon" style="background: url(' + icon + ')"></div>');
				this.pseudoDiv = $('<div class="tws_mi_pseudo"></div>');
				this.hoverDiv = $('<div class="tws_mi_hoverdiv"></div>');
				this.hitBox = $('<div class="tws_mi_hitbox"></div>');
				this.selectBox = new west.gui.Selectbox();
				this.buttons = [];

				this.divMain = $('<div class="ui_menucontainer"><div class="menucontainer_bottom"></div></div>')
					.append(this.iconDiv)
					.append(this.hoverDiv)
					.append(this.pseudoDiv)

				this.pseudoDiv.append(this.selectBox.getMainDiv());

				var self = this;

				this.pseudoDiv.hover(function() {
					if (imagehoverable)
						self.iconDiv.css("background-position", "-25px 0");
					else
						self.hoverDiv.show();
				}, function() {
					if (imagehoverable)
						self.iconDiv.css("background-position", "0 0");
					else
						self.hoverDiv.hide();
				});

				this.selectBox.addListener(function(i) {
					console.log(i);
					self.buttons[i]();
				});

				this.hoverDiv.hide();
				this.selectBox.divMain.hide();
				$("#ui_menubar").append(this.divMain);

			},
			_recreate: function() {
				var sb = this.selectBox;
				sb.show();
				sb.divWrap.remove();
				sb.divMain.appendTo(this.pseudoDiv);
				sb.divMain.css({left: "-185px", top: "-7px"});
				sb.divMain.hide();
				this.hitBox.css("height", this.selectBox.divMain.height());
			},
			addAction: function(text, desc, onclick) {
				var l = this.buttons.push(onclick),
					pd = this.pseudoDiv,
					self = this;

				this.selectBox.addItem(l-1, text, desc);
				this._recreate();

				if (l == 1) {
					var popup = new MousePopup(desc);
					this.iconDiv.addMousePopup(popup)
						.click(function() {
							self.buttons[0]();
						})
						.addClass("clickable");
				} else if (l == 2) {
					pd.append(this.hitBox);
					this.iconDiv.removeMousePopup()
						.removeClass("clickable")
						//.off("click");
					pd.hover(function() {
						self.selectBox.divMain.show();
						self.hitBox.show();
					}, function() {
						self.selectBox.divMain.hide();
						self.hitBox.hide();
					});
				}
			}
		});
		this.ContentBlock = Class(this.eventedComponent, {
			init: function(classname, name) {
				this.callParent();
				this.content = $('<div></div>');
				this.divMain = $('<div class="tws_block' + (classname && (' ' + classname) || '') + '"></div>');
				this.title = $('<strong></strong>');

				this.divMain.append(this.content);
				if (name)
					this.setName(name)
			},
			setName: function(name) {
				if (this.title.html() == "")
					this.divMain.prepend('<hr>').prepend(this.title);
				this.title.html(name);
			},
			setMinidesc: function(text) {
				if (!this.miniDesc)
					this.miniDesc = $('<p class="tws_block_minidesc"></p>').appendTo(this.divMain)
				this.miniDesc.html(text);
			},
			append: function(el) {
				this.content.append(el);
			}
		});
		this.List = Class(this.eventedComponent, {
			default: {
				autoJump: true
			},
			init: function(params) {
				var self = this;
				this.callParent(); // events: [keyup, keydown, focus, select]
				this.params = params || {};
				softExtend(this.params, this.default);
				this.divMain = $('<div class="tws_list"></div>');
				this.focused = false;
				this.addEventListener('keydown', this.keyDownHandler, this);
				$(document).keyup(function(e) {
					self.focused && self.eventsChain.call('keyup', [e]);
				}).keydown(function(e) {
					self.focused && self.eventsChain.call('keydown', [e]);
				});
				params.class && this.divMain.addClass(params.class);
			},
			keyDownHandler: function(e) {
				var key = e.which || e.keyCode;
				switch (key) {
					case 38: // up
						this.focusPrevious();
					break;
					case 40: // down
						this.focusNext();
					break;
					case 13: // enter
						this._selectFocused();
					break;
				}
			},
			_focusItem: function(item) {
				var focusedItem = this.getFocusedItem();
				focusedItem.removeClass('focus');
				item.addClass('focus');
				this.eventsChain.call('focus', [item]);
			},
			_selectFocused: function() {
				var item = this.getFocusedItem();
				if (item.length)
					this.eventsChain.call('select', [item]);
			},
			focus: function() {
				this.focused = true;
				return this;
			},
			blur: function() {
				this.focused = false;
				return this;
			},
			clear: function() {
				this.divMain.empty();
				return this;
			},
			getFocusedItem: function() {
				return this.$('.focus');
			},
			focusFirst: function() {
				this._focusItem(this.divMain.children().first());
				return this;
			},
			focusNext: function() {
				var focused = this.getFocusedItem(),
					next = focused.next();

				if (next.length)
					this._focusItem(next);
				else
					if (this.params.autoJump || !focused.length)
						this.focusFirst();
					else
						focused.removeClass('focus')

				return this;
			},
			focusPrevious: function() {
				var focused = this.getFocusedItem(),
					prev = focused.prev();

				if (prev.length)
					this._focusItem(prev);
				else
					if (this.params.autoJump || !focused.length)
						this._focusItem(this.divMain.children().last());
					else
						focused.removeClass('focus');

				return this;
			},
			addItem: function(name) {
				var self = this,
					tmp = document.createElement('p');

				tmp.innerHTML = name;
				tmp.className = 'tws_list_item';
				tmp.onmouseover = function() {
					self._focusItem($(tmp));
				}
				tmp.onmousedown = function() {
					self._selectFocused();
					return false;
				}
				this.divMain[0].appendChild(tmp);
				return this;
			}
		});
		this.ListedInput = Class(west.gui.Textfield, {
			default: {
				autoJump: true,
				autoSearch: true,
				searchDelay: 300,
				autoSelectFirst: true,
				setValueOnFocus: true,
				statusButton: false,
				showAllButton: false
			},
			init: function(params) {
				var self = this;
				this.params = params || {};
				softExtend(this.params, this.default);
				this.callParent(this.params.id, 'text', this.params.class);
				this.divMain.addClass('tws_li');
				this.List = new that.List({class: 'tws_li_list', autoJump: this.params.autoJump});
				this.eventsChain = new eventsChain(); // events: [input_keyup, input_blur, input_focus, input_select, list_select, input_changed, select]
				this.divMain.append(this.List.getMainDiv());
				/* Bindings */
				this.addEventListener('input_keyup', this.keyUpHandler, this)
					.addEventListener('input_blur', this.blurHandler, this)
					.addEventListener('input_focus', this.focusHandler, this)
					.addEventListener('input_changed', this.changedHandler, this)
					.addEventListener('data_changed', this.dataChangedHandler, this)
					.addEventListener('select', function(type, value) {
						self.eventsChain.call(type + '_select', [value]);
					});

				// on list select, call LI select
				this.List
				.addEventListener('select', function(el) {
					self.eventsChain.call('select', ['list', el.html()]);
				})
				.addEventListener('focus', function(el) {
					self.params.setValueOnFocus && self.setValue(el.html());
				});

				this.$('input').on('input propertychange', function(e) {
					self.eventsChain.call('input_changed', [e, self.getValue()]);	
				}).blur(function(e) {
					self.eventsChain.call('input_blur', [e]);
				}).keyup(function(e) {
					self.eventsChain.call('input_keyup', [e]);;
				}).focus(function(e) {
					self.eventsChain.call('input_focus', [e]);
				});
				this.params.statusButton && this.addStatus();
				this.params.showAllButton && this.addShowAll();
				this.params.data && this.setData(this.params.data);
			},
			STATES: {
				DEFAULT: 'default',
				LOADING: 'loading',
				OK: "ok",
				ERROR: 'error'
			},
			changedHandler: function(e, val) {
				if (this.params.autoSearch && val != '')
					this.seek();
			},
			keyUpHandler: function(e) {
				var key = e.which || e.keyCode;

				// for up and down keys 
				if (key == 38 || key == 40)
					return;

				// if enter & has focused item
				if (key == 13 && this.List.getFocusedItem().length)
					return;

				var	val = this.getValue();

				if (key == 13)
					this.eventsChain.call('select', ['input', val]);
				else if (val == '')
					this.showAll()
			},
			seek: function(noTimeout) {
				var self = this,
					delay = this.params.searchDelay;

				if (this.to)
					clearTimeout(this.to);

				if (delay && !noTimeout)
					this.to = setTimeout(function() {
						self.filter(self.getValue());
						self.to = null;
					}, this.params.searchDelay);
				else
					self.filter(this.getValue());
			},
			dataChangedHandler: function() {
				this.seek();
			},
			blurHandler: function() {
				this.List.blur();
				this.List.getMainDiv().hide();
			},
			focusHandler: function() {
				this.List.focus();
				this.List.getMainDiv().show();
				this.getValue() == '' && this.showAll();
			},
			addShowAll: function() {
				var self = this;
				this.showall = $('<div class="tws_li_showall"></div>');
				this.showall.click(function() {
					self.showAll();
				});
				this.List.getMainDiv().before(this.showall);
				return this;
			},
			addStatus: function() {
				this.status = $('<div class="tws_li_status"></div>');
				this.$('.tw2gui_textfield').append(this.status);
				this.$('input').css('padding-right', '25px');
				return this;
			},
			filter: function(text) {
				if (!this.data)
					return;

				var	searched = this.search(text);
				this._drawOptions(searched);
			},
			_drawOptions: function(els) {
				var	nodes = document.createDocumentFragment(),
					self = this;
				this.List.clear();
				each(els, function(el, name) {
					self.List.addItem(name);
				});
				if (this.params.autoSelectFirst)
					self.List.focusFirst();
			},
			setState: function(state) {
				if (!this.STATES[state.toUpperCase()])
					return control.throwError('unknown state');
				this.status.attr('class', 'tws_li_status tws_li_' + state);
				return this;
			},
			addEventListener: function(event, fn, ctx, data) {
				this.eventsChain.push.apply(this, arguments);
				return this;
			},
			showAll: function() {
				this._drawOptions(this.getData());
				return this;
			},
			search: function(pattern) {
				var result = {},
					pattern = new RegExp('^.*' + pattern + '(.*)$', 'i');
				each(this.data, function(value, name) {
					if (pattern.test(name))
						result[name] = value;
				});
				return result;
			},
			setData: function(data) {
				this.data = data;
				this.eventsChain.call('data_changed');
				return this;
			},
			getData: function() {
				return this.data;
			}
		});
		this.TagEditor = Class(this.eventedComponent, {
			default: {
				seperator: /\s*,\s*/,
				autoSeparate: true,
				caseSensetive: true,
				highlightClass: 'tws_te_highlight',
				customTags: false,
				placeHolder: null,
				addOnEnter: true
			},
			init: function(params) {
				this.callParent(); // events: [added, deleted, clicked]
				this.params = params || {};
				softExtend(this.params, this.default);
				this.divMain = $('<div class="tws_te"></div>')
				this.items = {};
				this.input = new that.ListedInput(this.params);
				this.input.addEventListener('input_changed', this.changedHandler, this);
				this.input.addEventListener('select', this.selectHandler, this);
				this.divMain.append(this.input.getMainDiv());
			},
			changedHandler: function(e, val) {
				if (this.params.seperator != null && this.params.autoSeparate)
					this._separate(val);
			},
			selectHandler: function(type, name) {
				if (type == 'input' && this.params.addOnEnter)
					this._separate(name);
				else if (type == 'list')
					this.addElement(name);
			},
			addElement: function(name, data) {
				if (this.isExist(name))
					return this._highlight(name);
				this.items[name] = {
					data: data,
					node: this._createItem(name)
				};
				this.divMain.append(this.items[name].node);
				this.eventsChain.call('added', [name]);
				return this;
			},
			removeElement: function(name) {
				this.items[name].node.remove();
				delete this.items[name];
				return this;
			},
			isExist: function(name) {
				return this.items[name] !== undefined;
			},
			_separate: function(text) {
				var parts = text.split(this.params.seperator),
					self = this;
				if (parts.length < 2)
					return;
				each(parts, function(part) {
					part != '' && self.addElement(part);
				});
				this.input.setValue('');
			},
			_highlight: function(name) {
				var el = this.items[name].node,
					self = this;
				function blink(time) {
					if (time == 3)
						return;
					el.addClass(self.params.highlightClass);
					setTimeout(function() {
						el.removeClass(self.params.highlightClass);
						setTimeout(function() {
							blink(++time);
						}, 175);
					}, 175)
				}
				blink(0);
			},
			_createItem: function(name) {
				var item = $('<div class="tws_te_item">' + name + '</div>'),
					del = $('<div class="tws_te_delete"></div>'),
					self = this;
				item.click(function() {
					self.eventsChain.call('clicked', [name]);
				});
				del.click(function() {
					self.removeElement(name);
					self.eventsChain.call('deleted', [name])
				});
				item.append(del);
				return item;
			}
		});
	}).addGui(function(main, control) {
		this.Common = {
			get: getWholeADom,
			chooseLang: function() {
				return $('<p>' + control("langPack", "choose_lang") + ':</p>');
			},
			langSelect: function() {
				var currentLanguage = TWS.Storage.get('language'),
					langPack = control("langPack", 'availableLangs'),
					langSelect = new west.gui.Combobox("tws_changelang").addListener(select);

				each(langPack, function(transl, name) {
					langSelect.addItem(name, transl);
				});
				langSelect.select(currentLanguage);
				function select(e) {
					TWS.Storage.set("language", e);
				}
				return langSelect.getMainDiv();
			}
		}
	}).addGui(function(main, control) {
		var mainWindow = new this.Window('tws', 'The West Sweets', 'noreload', 'TWS'),
			MI = new this.MenuIcon('http://tws.shelimov.me/images/icon.png', false),
			mainTab = new this.WindowTab(control("langPack", 'common_settings'), 'main', mainWindow),
			mods = new this.ContentBlock(null, control("langPack", 'mods_settings')),
			self = this;

		this.init = function() {
			mainTab.setTitle(control("langPack", 'common_settings_title'));
			mainTab.setMiniTitle("Main");
			mainTab.append(this.Common.get()).append(mods.getMainDiv());
			this.addTab(mainTab);
		}
		this.addTab = function(tab) {
			mainWindow.addTab(tab);
			MI.addAction(tab.getName(), s(control("langPack", "open_tab"), tab.getName()), function() {
				self.open(tab.getId());
			});
		}
		this.open = function(tid) {
			tid = tid || "main";
			mainWindow.open(tid);
		}
		this.getMods = function() {
			return mods;
		}
		this.getMainWindow = function() {
			return mainWindow;
		}
		this.getMainTab = function() {
			return mainTab;
		}
	}).addLangpack({
		common_settings: 'Общие',
		common_settings_title: 'Общие настройки',
		mods_settings: 'Модификации',
		open_tab: 'Открыть вкладку "%1"',
		choose_lang: "Выбрать язык",
		availableLangs: {
			ru: "Русский",
			en: "English"
		}
	}).defaultSettings({
		laguage: "en",
		version: SCRIPT_VERSION
	}, "common"
	).addCss(
		'.tws .tw2gui_window_tab_control_clipper { display: none; }\n' +
		'.tws #main { margin: 10px 5px 0 5px }\n' +
		'.tws #main .tws_block { width: 45%; float: left; }\n' +

		'.tws_mi_hoverdiv { width: 21px; height: 21px; background: rgb(255, 182, 53); z-index: 1; position: absolute; bottom: 2px; right: 2px; opacity: .15 }\n' +
		'.tws_mi_icon { width: 25px; height: 25px;\n }' +
		'.tws_mi_pseudo { width: 21px; height: 21px; background: transparent; z-index: 2; position: absolute; bottom: 2px; right: 2px;}\n' +
		'.tws_mi_hitbox { width: 50px; position: absolute; right: 0px; }\n' +
		'.tws_mi_pseudo .arrow { width: 10px !important; height: 20px !important; background: url(' + to_cdn('images/tw2gui/selectbox_arrows.png') + ') !important; top: 7px !important; left: 167px !important; }\n' +

		'.tws_list_item { height: 18px; }\n' +
		'.tws_list_item.focus { border: 1px solid #000; padding-left: 2px; background: rgba(0,0,0,.1); }\n' +

		'.tws_li { }\n' +
		'.tws_li_showall { width: 24px; height: 24px; display: inline-block; margin-bottom: -7px; background: url(' + to_cdn('images/tw2gui/searchbar_button_all.png') +') no-repeat }\n' +
		'.tws_li_list { background: url(' + to_cdn('images/tw2gui/textfield/textarea_bg.jpg') + '); border: 1px solid #000; display: none; padding: 2px 4px 2px 4px; }\n' +
		'.tws_li_status { width: 15px; height: 15px; display: inline-block; background-repeat: no-repeat; background-size: contain !important; margin-left: -22px; margin-bottom: -2px;  }\n' +
		'.tws_li_highlight { background-color: rgba(255,255,255,.5); } \n' +
		'.tws_li_default { background: none; }\n' +
		'.tws_li_ok { background: url(' + to_cdn('images/window/dailyactivity/positive.png') + ') }\n' +
		'.tws_li_error { background: url(' + to_cdn('images/window/dailyactivity/negative.png') + ') }\n' +
		'.tws_li_loading { background: url(' + to_cdn('images/throbber2.gif') + '); width: 15.5px; height: 12px; margin-bottom: -1px; }\n' +

		'.tws_te_item { display: inline-block; border: 1px solid #000; margin-left: 2px; padding: 2px; }\n' +
		'.tws_te_highlight { background: rgba(255,255,255,.5); }\n' +

		'.tws_block { margin: 5px; padding: 10px; border: 1px solid #000000; background: rgba(175, 146, 94, 0.5); -moz-border-radius: 10px; -webkit-border-radius: 10px; -khtml-border-radius: 10px; -o-border-radius: 10px; border-radius: 10px; }\n' + 
		'.tws_block hr { height: 1px; border: 0px none; margin: 5px 0px 5px 0px; color: #000; background-color: #000;  box-shadow: 0px 1px 1px rgba(255, 255, 255, 0.6); }\n' +
		'.tws_block_minidesc { position: absolute; right: 4px; top: 1px; font-size: 6pt; }\n' 
	).makeOnApiLoad();

	Factory('.Notifications', function(control) {
		var messages = control("getData", "messages");

		this.show = function(el, unique_name) {
			if (messages[unique_name])
				return;
			el.addButton(control("langPack", 'close'), function() {
				messages[unique_name] = true;
				TWS.Storage.set(unique_name, true, "Notifications")
			})
		}
		this.message = function(msg, type, title) {
			var m = new UserMessage(msg, type);
			if (title)
				m.setTitle(title)

			m.show();	
		}
		this.error = function(msg, module, fatal) {
			if (fatal) {
				!0
			} else
				this.message(msg, "error", module);
		}
	}).addData({
		messages: TWS.Storage.get(null, "Notifications") || {}
	}).addLangpack({
		close: "Закрыть",
		cancel: "Отмена"
	}).makeOnApiLoad();


	Factory('.DuelSafer', function(methods) {
		var data = methods("getData"),
			namespace = methods("getDesc").ns,
			self = this;

		function error(err, fatal) {
			TWS.Notifications.error(methods("langPack", err), namespace, fatal);

			return false;
		}
		function isCorrectType(type) {
			if (type == "town" || type == "alliance")
				return true;
			else
				error("error_wrong_type", fatal)
		}
		function updateStorage() {
			TWS.Storage.set("alliances", data.alliances, namespace);
			TWS.Storage.set("towns", data.towns, namespace);
		}

		this.init = function() {
			this.overwriteStartDuel();
		}
		this.add = function(type, name, cb) {
			if (this.isExistByName(type, name))
				return error("error_already_defined");

			var query = s("[%1]%2[/%1]", type, name);
			Ajax.remoteCall("settings", "get_parsed_text", {text: query}, function (response) {
				var s = response.parsed_text.match(/open\((\d+,?\d*)/);
				if (s) {
					data[type + 's'][s[1]] = name;
					updateStorage();
					cb(true);
				}
				else {
					error("error_not_found");
					cb(false)
				}
			});
		}
		this.remove = function(type, id) {
			if (!isCorrectType(type))
				return null;

			if (data[type + 's'][id]) {
				delete data[type + 's'][id];
				updateStorage();
				return true;
			}

			return false;

		}
		this.isExistByName = function(type, name) {
			if (!isCorrectType(type))
				return null;

			each(data[type + 's'], function(n) {
				if (name == n)
					return true;
			});

			return false;
		}
		this.isExistById = function(type, id) {
			if (!isCorrectType(type))
				return null;

			return data[type + 's'][id] !== undefined;
		}
		this.getById = function(type, id) {
			if (!isCorrectType(type))
				return null;

			return data[type + 's'][id];
		}
		this.get = function() {
			return data;
		}
		this.overwriteSaloonOpen = function() {
			var original = SaloonWindow.open;
		}
		this.startDuel = function(playerId, townPos, allianceId) {
			function start() {
				TaskQueue.add(new TaskDuel(playerId));
			}
			if (Character.homeTown.town_id && Character.homeTown.x + ',' + Character.homeTown.y == townPos)
				this.Gui.ask(true, true, start);
			else if (this.isExistById('town', townPos))
				this.Gui.ask(true, false, start, this.getById('town', townPos));
			else if (allianceId && allianceId == Character.homeTown.alliance_id)
				this.Gui.ask(false, true, start);
			else if (this.isExistById('alliance', allianceId))
				this.Gui.ask(false, false, start, this.getById('alliance', allianceId));
			else
				start();
		}
		this.getTownsByName = function(name, cb) {
			Ajax.remoteCallMode('ranking', 'get_data', {tab: 'cities', search: name}, cb);
		}
		this.overwriteStartDuel = function() {
			SaloonWindow.startDuel = function(pid, alid, force, view) {

				if ($.isEmptyObject(data.towns))
					return self.startDuel(pid, -1, alid);

				if (view) {
					var wid = view.window.id, query;

					if (wid == "player-list") {
						query = view.window.$("#player_row_" + pid + " .town_name a:first").attr("href");
					} else if (wid == "duels") {
						query = view.window.$("#dl_player_box_" + pid + " .dlp_townname a").attr("onclick");
					} else if (/playerprofile-\d+/.test(wid)) {
						query = view.window.$(".playerprofile-title-town a:first").attr("href");
					}

					var townId = query.match(/\.(open|center)\((\d+,\d+)/);
					if (townId == null)
						error("error_parse_town", true)
					else
						self.startDuel(pid, townId[2], alid);
				} else {
					Ajax.remoteCallMode("profile", "init", {playerId:pid}, function(resp) {
						if (resp.town)
							self.startDuel(pid, resp.town.town_x + ',' + resp.town.town_y, alid);
						else
							error("player_dont_have_city");
					});
				}
			}
		};
	}).addGui(function(main, m) {
		var Class = west.createClass,
			that = this;
		this.Item = Class(TWS.Gui.eventedComponent, {
			init: function(id, name) {
				this.callParent();
				this.divMain = $('<span class="tws_ds_item"></span>');
			},
			destroy: function() {
				this.divMain.remove();
				this.eventsChain.call("delete");
			},
			updateName: function() {

			}
		});
		this.DSBlock = Class(TWS.Gui.ContentBlock, {
			init: function(id, cls) {
				this.items = {};
				this.callParent('tws_ds_block');
				this.TagEditor = new TWS.Gui.TagEditor({setValueOnFocus: false, autoSeparate: false, addOnEnter: false});
				this.append(this.TagEditor.getMainDiv());
			},
			updateAll: function() {
				/* Обновить названия городов\альянсов */
			},
			addItem: function(item) {
				if (!(item instanceof self.Item))
					m("throwError", "item isn't instanceof Item");

				this.items[item.getId()] = item;
				this.divMain.append(item.getMainDiv());
			}
		});
		this.Towns = {
			wasDeleted: true,
			block: function() {
				var block = new that.DSBlock('tws_ds_alliances'),
					te = block.TagEditor,
					blocks = m("getData").towns;

				block.setMinidesc('Alliances');
				te.input.addEventListener('input_changed', this.searchAndShow, this, [block.TagEditor.input]);
				te.input.addStatus();

				return block.getMainDiv();

			},
			searchAndShow: function(li, e, text) {
				if (text.length > 2 && this.wasDeleted) {
					this.wasDeleted = false;
					li.setState('loading');
					clearTimeout(this.to);
					this.to = setTimeout(function() {
						Ajax.remoteCallMode('ranking', 'get_data', {tab: 'cities', search:text}, function(data) { 
							if (data.error || !data.ranking.length)
								li.setState('error');
							else {
								var temp_data = {};
								each(data.ranking, function(el) {
									temp_data[el.town_name] = el.town_x + "_" + el.town_y;
								});
								li.setData(temp_data);
								li.setState('ok');
							}
						});
					}, 500);
				} else if (text.length < 3) {
					li.setState('default');
					this.wasDeleted = true;
				}
			}
		}
	}).addGui(function(main, m) {
		var w = TWS.Gui.getMainWindow(),
			dstab = new TWS.Gui.WindowTab("DuelSafer", "ds", w);

		this.init = function() {
			dstab.setTitle("Duel Safer");
			dstab.setMiniTitle("DS");

			dstab.append(this.Towns.block());

			TWS.Gui.addTab(dstab);
		}
		this.ask = function(istown, own, cb, name) {
			var message,
				lp = m("langPack"),
				whoisit = $('<p></p>'),
				dialog = new west.gui.Dialog(lp('message_title'));
			if (own) {
				if (istown)
					return TWS.Notifications.error(lp('attack_own_town'));
				else 
					message = lp('attack_own_alliance');
			} else {
				if (istown) {
					message = lp('attack_allied_town');
					whoisit.html(s(lp('victim_town'), name));
				} else {
					message = lp('attack_allied_alliance');
					whoisit.html(s(lp('victim_alliance'), name));
				}
				message = $('<p>' + message + '</p>').append(whoisit);
			}
			console.log(message);
		}
	}).addData({
		alliances: TWS.Storage.get("alliances", "DuelSafer") || {},
		towns: TWS.Storage.get("towns", "DuelSafer") || {}
	}).addLangpack({
		player_dont_have_town: "Нельзя нападать на персонажей без города!",
		error_parse_town: "Не удалось прочитать город жертвы. Регулярное выражение вернуло NULL.",
		error_already_defined: "Данный город\\альянс уже присутствует в списке.",
		error_not_found: "Данный город\\альянс не найден",
		error_wrong_argument: "Передан некорректный ТИП друга",
		message_title: "Duel Safer",
		attack_own_town: "Атаковать жителей своего города нельзя!",
		attack_own_alliance: "Ты действительно хочешь напасть на члена своего альянса?",
		attack_allied_alliance: "Ты действительно хочешь напасть на союзный альянс?",
		attack_allied_town: "Ты хочешь напасть на союзный город?",
		towns: "Города",
		alliances: "Альянсы",
		victim_town: "Город: %1",
		victim_alliance: "Альянс: %1"
	}).makeOnApiLoad();

	Factory(".Wir", function(control) {
		var Scrollpane,
			Overwrites = {
				addItemDivToInv: function(item) {
					item.appendTo(Scrollpane.contentPane).getImgEl().off('click').click(function(e) {
						Inventory.clickHandler(item.getId(), e);
					}).data('itemId', item.getId()).setDraggable(Inventory.announceDragStart, Inventory.announceDragStop);
				},
				addItems: function(original) {
					return function(category, page) {
						var divMain = $(Scrollpane.getMainDiv());
						Scrollpane.contentPane.empty();
						original.apply(this, arguments);
						Scrollpane.scrollToTop();
						if (category == "set") {
							divMain.addClass("search");
						} else {
							divMain.removeClass("search");
						}
					};
				},
				firstLoad: function(original) {
					return function(opts) {
						Scrollpane = new west.gui.Scrollpane();
						Scrollpane.divMain.id = "fakebag";
						original.apply(this, arguments);
						Inventory.DOM.prepend(Scrollpane.getMainDiv());
					}
				} 
			};

		this.init = function() {
			var SIZE = 90000;
			Inventory.addItemDivToInv = Overwrites.addItemDivToInv;
			Inventory.addItems = Overwrites.addItems(Inventory.addItems);
			Inventory.firstLoad = Overwrites.firstLoad(Inventory.firstLoad);
			Inventory.size = SIZE;
			Inventory.sizeSearch = SIZE;
		}
	}).defaultSettings({
		enabled: true,
		mode: 4
	}).addCss(
		"#bag { display: none !important; }\n" +
		"#overlay_inv { display: block !important; }\n" +
		"#fakebag { margin-top: 129px; height: 305px; width: 260px; }\n" +
		"#inv_search_button { top: 407px; left: 194px; }\n" +
		"#search_div_inv { background-position: -30px -10px; width: 190px; height: 27px; top: 406px; left: 29px; }\n" +
		"#inv_search_container { margin: -1px 0 0 0; }\n" +
		"#delete_search { top: 410px; left: 225px; }\n" +
		"#fakebag.search { height: 275px; }\n" +
		"#fakebag .tw2gui_scrollpane_clipper_contentpane { overflow: hidden; }\n"
	).makeOnApiLoad();

})(window); // anonymous
console.timeEnd("tws")