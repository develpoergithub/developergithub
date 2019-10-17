
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = cb => requestAnimationFrame(cb);

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (!stop) {
                    return; // not ready
                }
                subscribers.forEach((s) => s[1]());
                subscribers.forEach((s) => s[0](value));
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        const invalidators = [];
        const store = readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                run_all(invalidators);
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
        return {
            subscribe(run, invalidate = noop) {
                invalidators.push(invalidate);
                const unsubscribe = store.subscribe(run, invalidate);
                return () => {
                    const index = invalidators.indexOf(invalidate);
                    if (index !== -1) {
                        invalidators.splice(index, 1);
                    }
                    unsubscribe();
                };
            }
        };
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.6.7 */
    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	var switch_instance_anchor, current;

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		return {
    			props: { params: ctx.componentParams },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = {};
    			if (changed.componentParams) switch_instance_changes.params = ctx.componentParams;

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    const hashPosition = window.location.href.indexOf('#/');
    let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/';

    // Check if there's a querystring
    const qsPosition = location.indexOf('?');
    let querystring = '';
    if (qsPosition > -1) {
        querystring = location.substr(qsPosition + 1);
        location = location.substr(0, qsPosition);
    }

    return {location, querystring}
    }

    /**
     * Readable store that returns the current full location (incl. querystring)
     */
    const loc = readable(
    getLocation(),
    // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
        const update = () => {
            set(getLocation());
        };
        window.addEventListener('hashchange', update, false);

        return function stop() {
            window.removeEventListener('hashchange', update, false);
        }
    }
    );

    /**
     * Readable store that returns the current location
     */
    const location = derived(
    loc,
    ($loc) => $loc.location
    );

    /**
     * Readable store that returns the current querystring
     */
    const querystring = derived(
    loc,
    ($loc) => $loc.querystring
    );

    /**
     * Navigates to a new page programmatically.
     *
     * @param {string} location - Path to navigate to (must start with `/`)
     */
    function push(location) {
    if (!location || location.length < 1 || location.charAt(0) != '/') {
        throw Error('Invalid parameter location')
    }

    // Execute this code when the current call stack is complete
    setTimeout(() => {
        window.location.hash = '#' + location;
    }, 0);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc;

    	validate_store(loc, 'loc');
    	subscribe($$self, loc, $$value => { $loc = $$value; $$invalidate('$loc', $loc); });

    	/**
     * Dictionary of all routes, in the format `'/path': component`.
     *
     * For example:
     * ````js
     * import HomeRoute from './routes/HomeRoute.svelte'
     * import BooksRoute from './routes/BooksRoute.svelte'
     * import NotFoundRoute from './routes/NotFoundRoute.svelte'
     * routes = {
     *     '/': HomeRoute,
     *     '/books': BooksRoute,
     *     '*': NotFoundRoute
     * }
     * ````
     */
    let { routes = {} } = $$props;

    /**
     * Container for a route: path, component
     */
    class RouteItem {
        /**
         * Initializes the object and creates a regular expression from the path, using regexparam.
         *
         * @param {string} path - Path to the route (must start with '/' or '*')
         * @param {SvelteComponent} component - Svelte component for the route
         */
        constructor(path, component) {
            // Path must start with '/' or '*'
            if (!path || path.length < 1 || (path.charAt(0) != '/' && path.charAt(0) != '*')) {
                throw Error('Invalid value for "path" argument')
            }

            const {pattern, keys} = regexparam(path);

            this.path = path;
            this.component = component;

            this._pattern = pattern;
            this._keys = keys;
        }

        /**
         * Checks if `path` matches the current route.
         * If there's a match, will return the list of parameters from the URL (if any).
         * In case of no match, the method will return `null`.
         *
         * @param {string} path - Path to test
         * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
         */
        match(path) {
            const matches = this._pattern.exec(path);
            if (matches === null) {
                return null
            }

            const out = {};
            let i = 0;
            while (i < this._keys.length) {
                out[this._keys[i]] = matches[++i] || null;
            }
            return out
        }
    }

    // Set up all routes
    const routesList = Object.keys(routes).map((path) => {
        return new RouteItem(path, routes[path])
    });

    // Props for the component to render
    let component = null;
    let componentParams = {};

    	const writable_props = ['routes'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('routes' in $$props) $$invalidate('routes', routes = $$props.routes);
    	};

    	$$self.$$.update = ($$dirty = { component: 1, $loc: 1 }) => {
    		if ($$dirty.component || $$dirty.$loc) { {
                // Find a route matching the location
                $$invalidate('component', component = null);
                let i = 0;
                while (!component && i < routesList.length) {
                    const match = routesList[i].match($loc.location);
                    if (match) {
                        $$invalidate('component', component = routesList[i].component);
                        $$invalidate('componentParams', componentParams = match);
                    }
                    i++;
                }
            } }
    	};

    	return { routes, component, componentParams };
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["routes"]);
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    const isLoggedIn = writable(false);
    const keepMeLoggedIn = writable(false);
    const lastLoggedIn = writable(33128064978);
    const refreshToken = writable('');
    const user = writable({});
    const invitations = writable([]);
    const connections = writable([]);
    const shifts = writable([]);
    const myShifts = writable([]);
    const menuDisplayed = writable(false);

    /* src\AuthRoute.svelte generated by Svelte v3.6.7 */

    function create_fragment$1(ctx) {
    	return {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $isLoggedIn, $location;

    	validate_store(isLoggedIn, 'isLoggedIn');
    	subscribe($$self, isLoggedIn, $$value => { $isLoggedIn = $$value; $$invalidate('$isLoggedIn', $isLoggedIn); });
    	validate_store(location, 'location');
    	subscribe($$self, location, $$value => { $location = $$value; $$invalidate('$location', $location); });

    	

      if ($isLoggedIn === false) {
        if ($location === "/" || $location === "/dashboard/") {
          push("/login");
        }
      } else {
        push("/dashboard/shifts");
      }
      // console.log("I am at : " + $location);

    	return {};
    }

    class AuthRoute extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src\Home.svelte generated by Svelte v3.6.7 */

    const file = "src\\Home.svelte";

    function create_fragment$2(ctx) {
    	var t, div, h1, div_intro, current;

    	var authroute = new AuthRoute({ $$inline: true });

    	return {
    		c: function create() {
    			authroute.$$.fragment.c();
    			t = space();
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Home Page";
    			attr(h1, "class", "svelte-ysidjt");
    			add_location(h1, file, 13, 2, 226);
    			add_location(div, file, 12, 0, 189);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(authroute, target, anchor);
    			insert(target, t, anchor);
    			insert(target, div, anchor);
    			append(div, h1);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(authroute.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 500 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(authroute.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(authroute, detaching);

    			if (detaching) {
    				detach(t);
    				detach(div);
    			}
    		}
    	};
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    	}
    }

    var nodejsCustomInspectSymbol = typeof Symbol === 'function' && typeof Symbol.for === 'function' ? Symbol.for('nodejs.util.inspect.custom') : undefined;

    function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    var MAX_ARRAY_LENGTH = 10;
    var MAX_RECURSIVE_DEPTH = 2;
    /**
     * Used to print values in error messages.
     */

    function inspect(value) {
      return formatValue(value, []);
    }

    function formatValue(value, seenValues) {
      switch (_typeof(value)) {
        case 'string':
          return JSON.stringify(value);

        case 'function':
          return value.name ? "[function ".concat(value.name, "]") : '[function]';

        case 'object':
          if (value === null) {
            return 'null';
          }

          return formatObjectValue(value, seenValues);

        default:
          return String(value);
      }
    }

    function formatObjectValue(value, previouslySeenValues) {
      if (previouslySeenValues.indexOf(value) !== -1) {
        return '[Circular]';
      }

      var seenValues = [].concat(previouslySeenValues, [value]);
      var customInspectFn = getCustomFn(value);

      if (customInspectFn !== undefined) {
        // $FlowFixMe(>=0.90.0)
        var customValue = customInspectFn.call(value); // check for infinite recursion

        if (customValue !== value) {
          return typeof customValue === 'string' ? customValue : formatValue(customValue, seenValues);
        }
      } else if (Array.isArray(value)) {
        return formatArray(value, seenValues);
      }

      return formatObject(value, seenValues);
    }

    function formatObject(object, seenValues) {
      var keys = Object.keys(object);

      if (keys.length === 0) {
        return '{}';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[' + getObjectTag(object) + ']';
      }

      var properties = keys.map(function (key) {
        var value = formatValue(object[key], seenValues);
        return key + ': ' + value;
      });
      return '{ ' + properties.join(', ') + ' }';
    }

    function formatArray(array, seenValues) {
      if (array.length === 0) {
        return '[]';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[Array]';
      }

      var len = Math.min(MAX_ARRAY_LENGTH, array.length);
      var remaining = array.length - len;
      var items = [];

      for (var i = 0; i < len; ++i) {
        items.push(formatValue(array[i], seenValues));
      }

      if (remaining === 1) {
        items.push('... 1 more item');
      } else if (remaining > 1) {
        items.push("... ".concat(remaining, " more items"));
      }

      return '[' + items.join(', ') + ']';
    }

    function getCustomFn(object) {
      var customInspectFn = object[String(nodejsCustomInspectSymbol)];

      if (typeof customInspectFn === 'function') {
        return customInspectFn;
      }

      if (typeof object.inspect === 'function') {
        return object.inspect;
      }
    }

    function getObjectTag(object) {
      var tag = Object.prototype.toString.call(object).replace(/^\[object /, '').replace(/]$/, '');

      if (tag === 'Object' && typeof object.constructor === 'function') {
        var name = object.constructor.name;

        if (typeof name === 'string') {
          return name;
        }
      }

      return tag;
    }

    var QueryDocumentKeys = {
      Name: [],
      Document: ['definitions'],
      OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
      VariableDefinition: ['variable', 'type', 'defaultValue', 'directives'],
      Variable: ['name'],
      SelectionSet: ['selections'],
      Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
      Argument: ['name', 'value'],
      FragmentSpread: ['name', 'directives'],
      InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
      FragmentDefinition: ['name', // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],
      IntValue: [],
      FloatValue: [],
      StringValue: [],
      BooleanValue: [],
      NullValue: [],
      EnumValue: [],
      ListValue: ['values'],
      ObjectValue: ['fields'],
      ObjectField: ['name', 'value'],
      Directive: ['name', 'arguments'],
      NamedType: ['name'],
      ListType: ['type'],
      NonNullType: ['type'],
      SchemaDefinition: ['directives', 'operationTypes'],
      OperationTypeDefinition: ['type'],
      ScalarTypeDefinition: ['description', 'name', 'directives'],
      ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
      FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
      InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
      InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
      UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
      EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
      EnumValueDefinition: ['description', 'name', 'directives'],
      InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
      DirectiveDefinition: ['description', 'name', 'arguments', 'locations'],
      SchemaExtension: ['directives', 'operationTypes'],
      ScalarTypeExtension: ['name', 'directives'],
      ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
      InterfaceTypeExtension: ['name', 'directives', 'fields'],
      UnionTypeExtension: ['name', 'directives', 'types'],
      EnumTypeExtension: ['name', 'directives', 'values'],
      InputObjectTypeExtension: ['name', 'directives', 'fields']
    };
    var BREAK = Object.freeze({});
    /**
     * visit() will walk through an AST using a depth first traversal, calling
     * the visitor's enter function at each node in the traversal, and calling the
     * leave function after visiting that node and all of its child nodes.
     *
     * By returning different values from the enter and leave functions, the
     * behavior of the visitor can be altered, including skipping over a sub-tree of
     * the AST (by returning false), editing the AST by returning a value or null
     * to remove the value, or to stop the whole traversal by returning BREAK.
     *
     * When using visit() to edit an AST, the original AST will not be modified, and
     * a new version of the AST with the changes applied will be returned from the
     * visit function.
     *
     *     const editedAST = visit(ast, {
     *       enter(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: skip visiting this node
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       },
     *       leave(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: no action
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       }
     *     });
     *
     * Alternatively to providing enter() and leave() functions, a visitor can
     * instead provide functions named the same as the kinds of AST nodes, or
     * enter/leave visitors at a named key, leading to four permutations of
     * visitor API:
     *
     * 1) Named visitors triggered when entering a node a specific kind.
     *
     *     visit(ast, {
     *       Kind(node) {
     *         // enter the "Kind" node
     *       }
     *     })
     *
     * 2) Named visitors that trigger upon entering and leaving a node of
     *    a specific kind.
     *
     *     visit(ast, {
     *       Kind: {
     *         enter(node) {
     *           // enter the "Kind" node
     *         }
     *         leave(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     *
     * 3) Generic visitors that trigger upon entering and leaving any node.
     *
     *     visit(ast, {
     *       enter(node) {
     *         // enter any node
     *       },
     *       leave(node) {
     *         // leave any node
     *       }
     *     })
     *
     * 4) Parallel visitors for entering and leaving nodes of a specific kind.
     *
     *     visit(ast, {
     *       enter: {
     *         Kind(node) {
     *           // enter the "Kind" node
     *         }
     *       },
     *       leave: {
     *         Kind(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     */

    function visit(root, visitor) {
      var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

      /* eslint-disable no-undef-init */
      var stack = undefined;
      var inArray = Array.isArray(root);
      var keys = [root];
      var index = -1;
      var edits = [];
      var node = undefined;
      var key = undefined;
      var parent = undefined;
      var path = [];
      var ancestors = [];
      var newRoot = root;
      /* eslint-enable no-undef-init */

      do {
        index++;
        var isLeaving = index === keys.length;
        var isEdited = isLeaving && edits.length !== 0;

        if (isLeaving) {
          key = ancestors.length === 0 ? undefined : path[path.length - 1];
          node = parent;
          parent = ancestors.pop();

          if (isEdited) {
            if (inArray) {
              node = node.slice();
            } else {
              var clone = {};

              for (var _i = 0, _Object$keys = Object.keys(node); _i < _Object$keys.length; _i++) {
                var k = _Object$keys[_i];
                clone[k] = node[k];
              }

              node = clone;
            }

            var editOffset = 0;

            for (var ii = 0; ii < edits.length; ii++) {
              var editKey = edits[ii][0];
              var editValue = edits[ii][1];

              if (inArray) {
                editKey -= editOffset;
              }

              if (inArray && editValue === null) {
                node.splice(editKey, 1);
                editOffset++;
              } else {
                node[editKey] = editValue;
              }
            }
          }

          index = stack.index;
          keys = stack.keys;
          edits = stack.edits;
          inArray = stack.inArray;
          stack = stack.prev;
        } else {
          key = parent ? inArray ? index : keys[index] : undefined;
          node = parent ? parent[key] : newRoot;

          if (node === null || node === undefined) {
            continue;
          }

          if (parent) {
            path.push(key);
          }
        }

        var result = void 0;

        if (!Array.isArray(node)) {
          if (!isNode(node)) {
            throw new Error('Invalid AST Node: ' + inspect(node));
          }

          var visitFn = getVisitFn(visitor, node.kind, isLeaving);

          if (visitFn) {
            result = visitFn.call(visitor, node, key, parent, path, ancestors);

            if (result === BREAK) {
              break;
            }

            if (result === false) {
              if (!isLeaving) {
                path.pop();
                continue;
              }
            } else if (result !== undefined) {
              edits.push([key, result]);

              if (!isLeaving) {
                if (isNode(result)) {
                  node = result;
                } else {
                  path.pop();
                  continue;
                }
              }
            }
          }
        }

        if (result === undefined && isEdited) {
          edits.push([key, node]);
        }

        if (isLeaving) {
          path.pop();
        } else {
          stack = {
            inArray: inArray,
            index: index,
            keys: keys,
            edits: edits,
            prev: stack
          };
          inArray = Array.isArray(node);
          keys = inArray ? node : visitorKeys[node.kind] || [];
          index = -1;
          edits = [];

          if (parent) {
            ancestors.push(parent);
          }

          parent = node;
        }
      } while (stack !== undefined);

      if (edits.length !== 0) {
        newRoot = edits[edits.length - 1][1];
      }

      return newRoot;
    }

    function isNode(maybeNode) {
      return Boolean(maybeNode && typeof maybeNode.kind === 'string');
    }
    /**
     * Given a visitor instance, if it is leaving or not, and a node kind, return
     * the function the visitor runtime should call.
     */

    function getVisitFn(visitor, kind, isLeaving) {
      var kindVisitor = visitor[kind];

      if (kindVisitor) {
        if (!isLeaving && typeof kindVisitor === 'function') {
          // { Kind() {} }
          return kindVisitor;
        }

        var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;

        if (typeof kindSpecificVisitor === 'function') {
          // { Kind: { enter() {}, leave() {} } }
          return kindSpecificVisitor;
        }
      } else {
        var specificVisitor = isLeaving ? visitor.leave : visitor.enter;

        if (specificVisitor) {
          if (typeof specificVisitor === 'function') {
            // { enter() {}, leave() {} }
            return specificVisitor;
          }

          var specificKindVisitor = specificVisitor[kind];

          if (typeof specificKindVisitor === 'function') {
            // { enter: { Kind() {} }, leave: { Kind() {} } }
            return specificKindVisitor;
          }
        }
      }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var genericMessage = "Invariant Violation";
    var _a = Object.setPrototypeOf, setPrototypeOf = _a === void 0 ? function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    } : _a;
    var InvariantError = /** @class */ (function (_super) {
        __extends(InvariantError, _super);
        function InvariantError(message) {
            if (message === void 0) { message = genericMessage; }
            var _this = _super.call(this, typeof message === "number"
                ? genericMessage + ": " + message + " (see https://github.com/apollographql/invariant-packages)"
                : message) || this;
            _this.framesToPop = 1;
            _this.name = genericMessage;
            setPrototypeOf(_this, InvariantError.prototype);
            return _this;
        }
        return InvariantError;
    }(Error));
    function invariant(condition, message) {
        if (!condition) {
            throw new InvariantError(message);
        }
    }
    function wrapConsoleMethod(method) {
        return function () {
            return console[method].apply(console, arguments);
        };
    }
    (function (invariant) {
        invariant.warn = wrapConsoleMethod("warn");
        invariant.error = wrapConsoleMethod("error");
    })(invariant || (invariant = {}));
    // Code that uses ts-invariant with rollup-plugin-invariant may want to
    // import this process stub to avoid errors evaluating process.env.NODE_ENV.
    // However, because most ESM-to-CJS compilers will rewrite the process import
    // as tsInvariant.process, which prevents proper replacement by minifiers, we
    // also attempt to define the stub globally when it is not already defined.
    var processStub = { env: {} };
    if (typeof process === "object") {
        processStub = process;
    }
    else
        try {
            // Using Function to evaluate this assignment in global scope also escapes
            // the strict mode of the current module, thereby allowing the assignment.
            // Inspired by https://github.com/facebook/regenerator/pull/369.
            Function("stub", "process = stub")(processStub);
        }
        catch (atLeastWeTried) {
            // The assignment can fail if a Content Security Policy heavy-handedly
            // forbids Function usage. In those environments, developers should take
            // extra care to replace process.env.NODE_ENV in their production builds,
            // or define an appropriate global.process polyfill.
        }
    //# sourceMappingURL=invariant.esm.js.map

    var fastJsonStableStringify = function (data, opts) {
        if (!opts) opts = {};
        if (typeof opts === 'function') opts = { cmp: opts };
        var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

        var cmp = opts.cmp && (function (f) {
            return function (node) {
                return function (a, b) {
                    var aobj = { key: a, value: node[a] };
                    var bobj = { key: b, value: node[b] };
                    return f(aobj, bobj);
                };
            };
        })(opts.cmp);

        var seen = [];
        return (function stringify (node) {
            if (node && node.toJSON && typeof node.toJSON === 'function') {
                node = node.toJSON();
            }

            if (node === undefined) return;
            if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
            if (typeof node !== 'object') return JSON.stringify(node);

            var i, out;
            if (Array.isArray(node)) {
                out = '[';
                for (i = 0; i < node.length; i++) {
                    if (i) out += ',';
                    out += stringify(node[i]) || 'null';
                }
                return out + ']';
            }

            if (node === null) return 'null';

            if (seen.indexOf(node) !== -1) {
                if (cycles) return JSON.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }

            var seenIndex = seen.push(node) - 1;
            var keys = Object.keys(node).sort(cmp && cmp(node));
            out = '';
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node[key]);

                if (!value) continue;
                if (out) out += ',';
                out += JSON.stringify(key) + ':' + value;
            }
            seen.splice(seenIndex, 1);
            return '{' + out + '}';
        })(data);
    };

    var _a$1 = Object.prototype, toString = _a$1.toString, hasOwnProperty = _a$1.hasOwnProperty;
    var previousComparisons = new Map();
    /**
     * Performs a deep equality check on two JavaScript values, tolerating cycles.
     */
    function equal(a, b) {
        try {
            return check(a, b);
        }
        finally {
            previousComparisons.clear();
        }
    }
    function check(a, b) {
        // If the two values are strictly equal, our job is easy.
        if (a === b) {
            return true;
        }
        // Object.prototype.toString returns a representation of the runtime type of
        // the given value that is considerably more precise than typeof.
        var aTag = toString.call(a);
        var bTag = toString.call(b);
        // If the runtime types of a and b are different, they could maybe be equal
        // under some interpretation of equality, but for simplicity and performance
        // we just return false instead.
        if (aTag !== bTag) {
            return false;
        }
        switch (aTag) {
            case '[object Array]':
                // Arrays are a lot like other objects, but we can cheaply compare their
                // lengths as a short-cut before comparing their elements.
                if (a.length !== b.length)
                    return false;
            // Fall through to object case...
            case '[object Object]': {
                if (previouslyCompared(a, b))
                    return true;
                var aKeys = Object.keys(a);
                var bKeys = Object.keys(b);
                // If `a` and `b` have a different number of enumerable keys, they
                // must be different.
                var keyCount = aKeys.length;
                if (keyCount !== bKeys.length)
                    return false;
                // Now make sure they have the same keys.
                for (var k = 0; k < keyCount; ++k) {
                    if (!hasOwnProperty.call(b, aKeys[k])) {
                        return false;
                    }
                }
                // Finally, check deep equality of all child properties.
                for (var k = 0; k < keyCount; ++k) {
                    var key = aKeys[k];
                    if (!check(a[key], b[key])) {
                        return false;
                    }
                }
                return true;
            }
            case '[object Error]':
                return a.name === b.name && a.message === b.message;
            case '[object Number]':
                // Handle NaN, which is !== itself.
                if (a !== a)
                    return b !== b;
            // Fall through to shared +a === +b case...
            case '[object Boolean]':
            case '[object Date]':
                return +a === +b;
            case '[object RegExp]':
            case '[object String]':
                return a == "" + b;
            case '[object Map]':
            case '[object Set]': {
                if (a.size !== b.size)
                    return false;
                if (previouslyCompared(a, b))
                    return true;
                var aIterator = a.entries();
                var isMap = aTag === '[object Map]';
                while (true) {
                    var info = aIterator.next();
                    if (info.done)
                        break;
                    // If a instanceof Set, aValue === aKey.
                    var _a = info.value, aKey = _a[0], aValue = _a[1];
                    // So this works the same way for both Set and Map.
                    if (!b.has(aKey)) {
                        return false;
                    }
                    // However, we care about deep equality of values only when dealing
                    // with Map structures.
                    if (isMap && !check(aValue, b.get(aKey))) {
                        return false;
                    }
                }
                return true;
            }
        }
        // Otherwise the values are not equal.
        return false;
    }
    function previouslyCompared(a, b) {
        // Though cyclic references can make an object graph appear infinite from the
        // perspective of a depth-first traversal, the graph still contains a finite
        // number of distinct object references. We use the previousComparisons cache
        // to avoid comparing the same pair of object references more than once, which
        // guarantees termination (even if we end up comparing every object in one
        // graph to every object in the other graph, which is extremely unlikely),
        // while still allowing weird isomorphic structures (like rings with different
        // lengths) a chance to pass the equality test.
        var bSet = previousComparisons.get(a);
        if (bSet) {
            // Return true here because we can be sure false will be returned somewhere
            // else if the objects are not equivalent.
            if (bSet.has(b))
                return true;
        }
        else {
            previousComparisons.set(a, bSet = new Set);
        }
        bSet.add(b);
        return false;
    }
    //# sourceMappingURL=equality.esm.js.map

    function isStringValue(value) {
        return value.kind === 'StringValue';
    }
    function isBooleanValue(value) {
        return value.kind === 'BooleanValue';
    }
    function isIntValue(value) {
        return value.kind === 'IntValue';
    }
    function isFloatValue(value) {
        return value.kind === 'FloatValue';
    }
    function isVariable(value) {
        return value.kind === 'Variable';
    }
    function isObjectValue(value) {
        return value.kind === 'ObjectValue';
    }
    function isListValue(value) {
        return value.kind === 'ListValue';
    }
    function isEnumValue(value) {
        return value.kind === 'EnumValue';
    }
    function isNullValue(value) {
        return value.kind === 'NullValue';
    }
    function valueToObjectRepresentation(argObj, name, value, variables) {
        if (isIntValue(value) || isFloatValue(value)) {
            argObj[name.value] = Number(value.value);
        }
        else if (isBooleanValue(value) || isStringValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isObjectValue(value)) {
            var nestedArgObj_1 = {};
            value.fields.map(function (obj) {
                return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
            });
            argObj[name.value] = nestedArgObj_1;
        }
        else if (isVariable(value)) {
            var variableValue = (variables || {})[value.name.value];
            argObj[name.value] = variableValue;
        }
        else if (isListValue(value)) {
            argObj[name.value] = value.values.map(function (listValue) {
                var nestedArgArrayObj = {};
                valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
                return nestedArgArrayObj[name.value];
            });
        }
        else if (isEnumValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isNullValue(value)) {
            argObj[name.value] = null;
        }
        else {
            throw process.env.NODE_ENV === "production" ? new InvariantError(17) : new InvariantError("The inline argument \"" + name.value + "\" of kind \"" + value.kind + "\"" +
                'is not supported. Use variables instead of inline arguments to ' +
                'overcome this limitation.');
        }
    }
    function storeKeyNameFromField(field, variables) {
        var directivesObj = null;
        if (field.directives) {
            directivesObj = {};
            field.directives.forEach(function (directive) {
                directivesObj[directive.name.value] = {};
                if (directive.arguments) {
                    directive.arguments.forEach(function (_a) {
                        var name = _a.name, value = _a.value;
                        return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
                    });
                }
            });
        }
        var argObj = null;
        if (field.arguments && field.arguments.length) {
            argObj = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj, name, value, variables);
            });
        }
        return getStoreKeyName(field.name.value, argObj, directivesObj);
    }
    var KNOWN_DIRECTIVES = [
        'connection',
        'include',
        'skip',
        'client',
        'rest',
        'export',
    ];
    function getStoreKeyName(fieldName, args, directives) {
        if (directives &&
            directives['connection'] &&
            directives['connection']['key']) {
            if (directives['connection']['filter'] &&
                directives['connection']['filter'].length > 0) {
                var filterKeys = directives['connection']['filter']
                    ? directives['connection']['filter']
                    : [];
                filterKeys.sort();
                var queryArgs_1 = args;
                var filteredArgs_1 = {};
                filterKeys.forEach(function (key) {
                    filteredArgs_1[key] = queryArgs_1[key];
                });
                return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
            }
            else {
                return directives['connection']['key'];
            }
        }
        var completeFieldName = fieldName;
        if (args) {
            var stringifiedArgs = fastJsonStableStringify(args);
            completeFieldName += "(" + stringifiedArgs + ")";
        }
        if (directives) {
            Object.keys(directives).forEach(function (key) {
                if (KNOWN_DIRECTIVES.indexOf(key) !== -1)
                    return;
                if (directives[key] && Object.keys(directives[key]).length) {
                    completeFieldName += "@" + key + "(" + JSON.stringify(directives[key]) + ")";
                }
                else {
                    completeFieldName += "@" + key;
                }
            });
        }
        return completeFieldName;
    }
    function argumentsObjectFromField(field, variables) {
        if (field.arguments && field.arguments.length) {
            var argObj_1 = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj_1, name, value, variables);
            });
            return argObj_1;
        }
        return null;
    }
    function resultKeyNameFromField(field) {
        return field.alias ? field.alias.value : field.name.value;
    }
    function isField(selection) {
        return selection.kind === 'Field';
    }
    function isInlineFragment(selection) {
        return selection.kind === 'InlineFragment';
    }
    function isIdValue(idObject) {
        return idObject &&
            idObject.type === 'id' &&
            typeof idObject.generated === 'boolean';
    }
    function toIdValue(idConfig, generated) {
        if (generated === void 0) { generated = false; }
        return __assign({ type: 'id', generated: generated }, (typeof idConfig === 'string'
            ? { id: idConfig, typename: undefined }
            : idConfig));
    }
    function isJsonValue(jsonObject) {
        return (jsonObject != null &&
            typeof jsonObject === 'object' &&
            jsonObject.type === 'json');
    }

    function getDirectiveInfoFromField(field, variables) {
        if (field.directives && field.directives.length) {
            var directiveObj_1 = {};
            field.directives.forEach(function (directive) {
                directiveObj_1[directive.name.value] = argumentsObjectFromField(directive, variables);
            });
            return directiveObj_1;
        }
        return null;
    }
    function shouldInclude(selection, variables) {
        if (variables === void 0) { variables = {}; }
        return getInclusionDirectives(selection.directives).every(function (_a) {
            var directive = _a.directive, ifArgument = _a.ifArgument;
            var evaledValue = false;
            if (ifArgument.value.kind === 'Variable') {
                evaledValue = variables[ifArgument.value.name.value];
                process.env.NODE_ENV === "production" ? invariant(evaledValue !== void 0, 3) : invariant(evaledValue !== void 0, "Invalid variable referenced in @" + directive.name.value + " directive.");
            }
            else {
                evaledValue = ifArgument.value.value;
            }
            return directive.name.value === 'skip' ? !evaledValue : evaledValue;
        });
    }
    function getDirectiveNames(doc) {
        var names = [];
        visit(doc, {
            Directive: function (node) {
                names.push(node.name.value);
            },
        });
        return names;
    }
    function hasDirectives(names, doc) {
        return getDirectiveNames(doc).some(function (name) { return names.indexOf(name) > -1; });
    }
    function hasClientExports(document) {
        return (document &&
            hasDirectives(['client'], document) &&
            hasDirectives(['export'], document));
    }
    function isInclusionDirective(_a) {
        var value = _a.name.value;
        return value === 'skip' || value === 'include';
    }
    function getInclusionDirectives(directives) {
        return directives ? directives.filter(isInclusionDirective).map(function (directive) {
            var directiveArguments = directive.arguments;
            var directiveName = directive.name.value;
            process.env.NODE_ENV === "production" ? invariant(directiveArguments && directiveArguments.length === 1, 4) : invariant(directiveArguments && directiveArguments.length === 1, "Incorrect number of arguments for the @" + directiveName + " directive.");
            var ifArgument = directiveArguments[0];
            process.env.NODE_ENV === "production" ? invariant(ifArgument.name && ifArgument.name.value === 'if', 5) : invariant(ifArgument.name && ifArgument.name.value === 'if', "Invalid argument for the @" + directiveName + " directive.");
            var ifValue = ifArgument.value;
            process.env.NODE_ENV === "production" ? invariant(ifValue &&
                (ifValue.kind === 'Variable' || ifValue.kind === 'BooleanValue'), 6) : invariant(ifValue &&
                (ifValue.kind === 'Variable' || ifValue.kind === 'BooleanValue'), "Argument for the @" + directiveName + " directive must be a variable or a boolean value.");
            return { directive: directive, ifArgument: ifArgument };
        }) : [];
    }

    function getFragmentQueryDocument(document, fragmentName) {
        var actualFragmentName = fragmentName;
        var fragments = [];
        document.definitions.forEach(function (definition) {
            if (definition.kind === 'OperationDefinition') {
                throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("Found a " + definition.operation + " operation" + (definition.name ? " named '" + definition.name.value + "'" : '') + ". " +
                    'No operations are allowed when using a fragment as a query. Only fragments are allowed.');
            }
            if (definition.kind === 'FragmentDefinition') {
                fragments.push(definition);
            }
        });
        if (typeof actualFragmentName === 'undefined') {
            process.env.NODE_ENV === "production" ? invariant(fragments.length === 1, 2) : invariant(fragments.length === 1, "Found " + fragments.length + " fragments. `fragmentName` must be provided when there is not exactly 1 fragment.");
            actualFragmentName = fragments[0].name.value;
        }
        var query = __assign({}, document, { definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    selectionSet: {
                        kind: 'SelectionSet',
                        selections: [
                            {
                                kind: 'FragmentSpread',
                                name: {
                                    kind: 'Name',
                                    value: actualFragmentName,
                                },
                            },
                        ],
                    },
                }
            ].concat(document.definitions) });
        return query;
    }

    function assign$1(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        sources.forEach(function (source) {
            if (typeof source === 'undefined' || source === null) {
                return;
            }
            Object.keys(source).forEach(function (key) {
                target[key] = source[key];
            });
        });
        return target;
    }
    function checkDocument(doc) {
        process.env.NODE_ENV === "production" ? invariant(doc && doc.kind === 'Document', 8) : invariant(doc && doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        var operations = doc.definitions
            .filter(function (d) { return d.kind !== 'FragmentDefinition'; })
            .map(function (definition) {
            if (definition.kind !== 'OperationDefinition') {
                throw process.env.NODE_ENV === "production" ? new InvariantError(9) : new InvariantError("Schema type definitions not allowed in queries. Found: \"" + definition.kind + "\"");
            }
            return definition;
        });
        process.env.NODE_ENV === "production" ? invariant(operations.length <= 1, 10) : invariant(operations.length <= 1, "Ambiguous GraphQL document: contains " + operations.length + " operations");
        return doc;
    }
    function getOperationDefinition(doc) {
        checkDocument(doc);
        return doc.definitions.filter(function (definition) { return definition.kind === 'OperationDefinition'; })[0];
    }
    function getOperationName(doc) {
        return (doc.definitions
            .filter(function (definition) {
            return definition.kind === 'OperationDefinition' && definition.name;
        })
            .map(function (x) { return x.name.value; })[0] || null);
    }
    function getFragmentDefinitions(doc) {
        return doc.definitions.filter(function (definition) { return definition.kind === 'FragmentDefinition'; });
    }
    function getQueryDefinition(doc) {
        var queryDef = getOperationDefinition(doc);
        process.env.NODE_ENV === "production" ? invariant(queryDef && queryDef.operation === 'query', 12) : invariant(queryDef && queryDef.operation === 'query', 'Must contain a query definition.');
        return queryDef;
    }
    function getFragmentDefinition(doc) {
        process.env.NODE_ENV === "production" ? invariant(doc.kind === 'Document', 13) : invariant(doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        process.env.NODE_ENV === "production" ? invariant(doc.definitions.length <= 1, 14) : invariant(doc.definitions.length <= 1, 'Fragment must have exactly one definition.');
        var fragmentDef = doc.definitions[0];
        process.env.NODE_ENV === "production" ? invariant(fragmentDef.kind === 'FragmentDefinition', 15) : invariant(fragmentDef.kind === 'FragmentDefinition', 'Must be a fragment definition.');
        return fragmentDef;
    }
    function getMainDefinition(queryDoc) {
        checkDocument(queryDoc);
        var fragmentDefinition;
        for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
            var definition = _a[_i];
            if (definition.kind === 'OperationDefinition') {
                var operation = definition.operation;
                if (operation === 'query' ||
                    operation === 'mutation' ||
                    operation === 'subscription') {
                    return definition;
                }
            }
            if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
                fragmentDefinition = definition;
            }
        }
        if (fragmentDefinition) {
            return fragmentDefinition;
        }
        throw process.env.NODE_ENV === "production" ? new InvariantError(16) : new InvariantError('Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.');
    }
    function createFragmentMap(fragments) {
        if (fragments === void 0) { fragments = []; }
        var symTable = {};
        fragments.forEach(function (fragment) {
            symTable[fragment.name.value] = fragment;
        });
        return symTable;
    }
    function getDefaultValues(definition) {
        if (definition &&
            definition.variableDefinitions &&
            definition.variableDefinitions.length) {
            var defaultValues = definition.variableDefinitions
                .filter(function (_a) {
                var defaultValue = _a.defaultValue;
                return defaultValue;
            })
                .map(function (_a) {
                var variable = _a.variable, defaultValue = _a.defaultValue;
                var defaultValueObj = {};
                valueToObjectRepresentation(defaultValueObj, variable.name, defaultValue);
                return defaultValueObj;
            });
            return assign$1.apply(void 0, [{}].concat(defaultValues));
        }
        return {};
    }

    function filterInPlace(array, test, context) {
        var target = 0;
        array.forEach(function (elem, i) {
            if (test.call(this, elem, i, array)) {
                array[target++] = elem;
            }
        }, context);
        array.length = target;
        return array;
    }

    var TYPENAME_FIELD = {
        kind: 'Field',
        name: {
            kind: 'Name',
            value: '__typename',
        },
    };
    function isEmpty(op, fragments) {
        return op.selectionSet.selections.every(function (selection) {
            return selection.kind === 'FragmentSpread' &&
                isEmpty(fragments[selection.name.value], fragments);
        });
    }
    function nullIfDocIsEmpty(doc) {
        return isEmpty(getOperationDefinition(doc) || getFragmentDefinition(doc), createFragmentMap(getFragmentDefinitions(doc)))
            ? null
            : doc;
    }
    function getDirectiveMatcher(directives) {
        return function directiveMatcher(directive) {
            return directives.some(function (dir) {
                return (dir.name && dir.name === directive.name.value) ||
                    (dir.test && dir.test(directive));
            });
        };
    }
    function removeDirectivesFromDocument(directives, doc) {
        var variablesInUse = Object.create(null);
        var variablesToRemove = [];
        var fragmentSpreadsInUse = Object.create(null);
        var fragmentSpreadsToRemove = [];
        var modifiedDoc = nullIfDocIsEmpty(visit(doc, {
            Variable: {
                enter: function (node, _key, parent) {
                    if (parent.kind !== 'VariableDefinition') {
                        variablesInUse[node.name.value] = true;
                    }
                },
            },
            Field: {
                enter: function (node) {
                    if (directives && node.directives) {
                        var shouldRemoveField = directives.some(function (directive) { return directive.remove; });
                        if (shouldRemoveField &&
                            node.directives &&
                            node.directives.some(getDirectiveMatcher(directives))) {
                            if (node.arguments) {
                                node.arguments.forEach(function (arg) {
                                    if (arg.value.kind === 'Variable') {
                                        variablesToRemove.push({
                                            name: arg.value.name.value,
                                        });
                                    }
                                });
                            }
                            if (node.selectionSet) {
                                getAllFragmentSpreadsFromSelectionSet(node.selectionSet).forEach(function (frag) {
                                    fragmentSpreadsToRemove.push({
                                        name: frag.name.value,
                                    });
                                });
                            }
                            return null;
                        }
                    }
                },
            },
            FragmentSpread: {
                enter: function (node) {
                    fragmentSpreadsInUse[node.name.value] = true;
                },
            },
            Directive: {
                enter: function (node) {
                    if (getDirectiveMatcher(directives)(node)) {
                        return null;
                    }
                },
            },
        }));
        if (modifiedDoc &&
            filterInPlace(variablesToRemove, function (v) { return !variablesInUse[v.name]; }).length) {
            modifiedDoc = removeArgumentsFromDocument(variablesToRemove, modifiedDoc);
        }
        if (modifiedDoc &&
            filterInPlace(fragmentSpreadsToRemove, function (fs) { return !fragmentSpreadsInUse[fs.name]; })
                .length) {
            modifiedDoc = removeFragmentSpreadFromDocument(fragmentSpreadsToRemove, modifiedDoc);
        }
        return modifiedDoc;
    }
    function addTypenameToDocument(doc) {
        return visit(checkDocument(doc), {
            SelectionSet: {
                enter: function (node, _key, parent) {
                    if (parent &&
                        parent.kind === 'OperationDefinition') {
                        return;
                    }
                    var selections = node.selections;
                    if (!selections) {
                        return;
                    }
                    var skip = selections.some(function (selection) {
                        return (isField(selection) &&
                            (selection.name.value === '__typename' ||
                                selection.name.value.lastIndexOf('__', 0) === 0));
                    });
                    if (skip) {
                        return;
                    }
                    var field = parent;
                    if (isField(field) &&
                        field.directives &&
                        field.directives.some(function (d) { return d.name.value === 'export'; })) {
                        return;
                    }
                    return __assign({}, node, { selections: selections.concat([TYPENAME_FIELD]) });
                },
            },
        });
    }
    var connectionRemoveConfig = {
        test: function (directive) {
            var willRemove = directive.name.value === 'connection';
            if (willRemove) {
                if (!directive.arguments ||
                    !directive.arguments.some(function (arg) { return arg.name.value === 'key'; })) {
                    process.env.NODE_ENV === "production" || invariant.warn('Removing an @connection directive even though it does not have a key. ' +
                        'You may want to use the key parameter to specify a store key.');
                }
            }
            return willRemove;
        },
    };
    function removeConnectionDirectiveFromDocument(doc) {
        return removeDirectivesFromDocument([connectionRemoveConfig], checkDocument(doc));
    }
    function getArgumentMatcher(config) {
        return function argumentMatcher(argument) {
            return config.some(function (aConfig) {
                return argument.value &&
                    argument.value.kind === 'Variable' &&
                    argument.value.name &&
                    (aConfig.name === argument.value.name.value ||
                        (aConfig.test && aConfig.test(argument)));
            });
        };
    }
    function removeArgumentsFromDocument(config, doc) {
        var argMatcher = getArgumentMatcher(config);
        return nullIfDocIsEmpty(visit(doc, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign({}, node, { variableDefinitions: node.variableDefinitions.filter(function (varDef) {
                            return !config.some(function (arg) { return arg.name === varDef.variable.name.value; });
                        }) });
                },
            },
            Field: {
                enter: function (node) {
                    var shouldRemoveField = config.some(function (argConfig) { return argConfig.remove; });
                    if (shouldRemoveField) {
                        var argMatchCount_1 = 0;
                        node.arguments.forEach(function (arg) {
                            if (argMatcher(arg)) {
                                argMatchCount_1 += 1;
                            }
                        });
                        if (argMatchCount_1 === 1) {
                            return null;
                        }
                    }
                },
            },
            Argument: {
                enter: function (node) {
                    if (argMatcher(node)) {
                        return null;
                    }
                },
            },
        }));
    }
    function removeFragmentSpreadFromDocument(config, doc) {
        function enter(node) {
            if (config.some(function (def) { return def.name === node.name.value; })) {
                return null;
            }
        }
        return nullIfDocIsEmpty(visit(doc, {
            FragmentSpread: { enter: enter },
            FragmentDefinition: { enter: enter },
        }));
    }
    function getAllFragmentSpreadsFromSelectionSet(selectionSet) {
        var allFragments = [];
        selectionSet.selections.forEach(function (selection) {
            if ((isField(selection) || isInlineFragment(selection)) &&
                selection.selectionSet) {
                getAllFragmentSpreadsFromSelectionSet(selection.selectionSet).forEach(function (frag) { return allFragments.push(frag); });
            }
            else if (selection.kind === 'FragmentSpread') {
                allFragments.push(selection);
            }
        });
        return allFragments;
    }
    function buildQueryFromSelectionSet(document) {
        var definition = getMainDefinition(document);
        var definitionOperation = definition.operation;
        if (definitionOperation === 'query') {
            return document;
        }
        var modifiedDoc = visit(document, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign({}, node, { operation: 'query' });
                },
            },
        });
        return modifiedDoc;
    }
    function removeClientSetsFromDocument(document) {
        checkDocument(document);
        var modifiedDoc = removeDirectivesFromDocument([
            {
                test: function (directive) { return directive.name.value === 'client'; },
                remove: true,
            },
        ], document);
        if (modifiedDoc) {
            modifiedDoc = visit(modifiedDoc, {
                FragmentDefinition: {
                    enter: function (node) {
                        if (node.selectionSet) {
                            var isTypenameOnly = node.selectionSet.selections.every(function (selection) {
                                return isField(selection) && selection.name.value === '__typename';
                            });
                            if (isTypenameOnly) {
                                return null;
                            }
                        }
                    },
                },
            });
        }
        return modifiedDoc;
    }

    var canUseWeakMap = typeof WeakMap === 'function' && !(typeof navigator === 'object' &&
        navigator.product === 'ReactNative');

    var toString$1 = Object.prototype.toString;
    function cloneDeep(value) {
        return cloneDeepHelper(value, new Map());
    }
    function cloneDeepHelper(val, seen) {
        switch (toString$1.call(val)) {
            case "[object Array]": {
                if (seen.has(val))
                    return seen.get(val);
                var copy_1 = val.slice(0);
                seen.set(val, copy_1);
                copy_1.forEach(function (child, i) {
                    copy_1[i] = cloneDeepHelper(child, seen);
                });
                return copy_1;
            }
            case "[object Object]": {
                if (seen.has(val))
                    return seen.get(val);
                var copy_2 = Object.create(Object.getPrototypeOf(val));
                seen.set(val, copy_2);
                Object.keys(val).forEach(function (key) {
                    copy_2[key] = cloneDeepHelper(val[key], seen);
                });
                return copy_2;
            }
            default:
                return val;
        }
    }

    function getEnv() {
        if (typeof process !== 'undefined' && process.env.NODE_ENV) {
            return process.env.NODE_ENV;
        }
        return 'development';
    }
    function isEnv(env) {
        return getEnv() === env;
    }
    function isProduction() {
        return isEnv('production') === true;
    }
    function isDevelopment() {
        return isEnv('development') === true;
    }
    function isTest() {
        return isEnv('test') === true;
    }

    function tryFunctionOrLogError(f) {
        try {
            return f();
        }
        catch (e) {
            if (console.error) {
                console.error(e);
            }
        }
    }
    function graphQLResultHasError(result) {
        return result.errors && result.errors.length;
    }

    function deepFreeze(o) {
        Object.freeze(o);
        Object.getOwnPropertyNames(o).forEach(function (prop) {
            if (o[prop] !== null &&
                (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
                !Object.isFrozen(o[prop])) {
                deepFreeze(o[prop]);
            }
        });
        return o;
    }
    function maybeDeepFreeze(obj) {
        if (isDevelopment() || isTest()) {
            var symbolIsPolyfilled = typeof Symbol === 'function' && typeof Symbol('') === 'string';
            if (!symbolIsPolyfilled) {
                return deepFreeze(obj);
            }
        }
        return obj;
    }

    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    function mergeDeep() {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sources[_i] = arguments[_i];
        }
        return mergeDeepArray(sources);
    }
    function mergeDeepArray(sources) {
        var target = sources[0] || {};
        var count = sources.length;
        if (count > 1) {
            var pastCopies = [];
            target = shallowCopyForMerge(target, pastCopies);
            for (var i = 1; i < count; ++i) {
                target = mergeHelper(target, sources[i], pastCopies);
            }
        }
        return target;
    }
    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    function mergeHelper(target, source, pastCopies) {
        if (isObject(source) && isObject(target)) {
            if (Object.isExtensible && !Object.isExtensible(target)) {
                target = shallowCopyForMerge(target, pastCopies);
            }
            Object.keys(source).forEach(function (sourceKey) {
                var sourceValue = source[sourceKey];
                if (hasOwnProperty$1.call(target, sourceKey)) {
                    var targetValue = target[sourceKey];
                    if (sourceValue !== targetValue) {
                        target[sourceKey] = mergeHelper(shallowCopyForMerge(targetValue, pastCopies), sourceValue, pastCopies);
                    }
                }
                else {
                    target[sourceKey] = sourceValue;
                }
            });
            return target;
        }
        return source;
    }
    function shallowCopyForMerge(value, pastCopies) {
        if (value !== null &&
            typeof value === 'object' &&
            pastCopies.indexOf(value) < 0) {
            if (Array.isArray(value)) {
                value = value.slice(0);
            }
            else {
                value = __assign({ __proto__: Object.getPrototypeOf(value) }, value);
            }
            pastCopies.push(value);
        }
        return value;
    }
    //# sourceMappingURL=bundle.esm.js.map

    var OBSERVABLE;
    function isObservable(value) {
        // Lazy-load Symbol to give polyfills a chance to run
        if (!OBSERVABLE) {
            OBSERVABLE =
                (typeof Symbol === 'function' && Symbol.observable) || '@@observable';
        }
        return value && value[OBSERVABLE] && value[OBSERVABLE]() === value;
    }
    function deferred(set, initial) {
        var initialized = initial !== undefined;
        var resolve;
        var reject;
        // Set initial value
        set(initialized
            ? initial
            : new Promise(function (_resolve, _reject) {
                resolve = _resolve;
                reject = _reject;
            }));
        return {
            fulfill: function (value) {
                if (initialized)
                    return set(Promise.resolve(value));
                initialized = true;
                resolve(value);
            },
            reject: function (error) {
                if (initialized)
                    return set(Promise.reject(error));
                initialized = true;
                reject(error);
            }
        };
    }

    var noop$1 = function () { };
    function observe(observable, initial) {
        if (!isObservable(observable)) {
            return readable(observable, noop$1);
        }
        return readable(undefined, function (set) {
            var _a = deferred(set, initial), fulfill = _a.fulfill, reject = _a.reject;
            var subscription = observable.subscribe({
                next: function (value) {
                    fulfill(value);
                },
                error: function (err) {
                    reject(err);
                }
            });
            return function () { return subscription.unsubscribe(); };
        });
    }
    //# sourceMappingURL=svelte-observable.es.js.map

    var CLIENT = typeof Symbol !== 'undefined' ? Symbol('client') : '@@client';
    function getClient() {
        return getContext(CLIENT);
    }
    function setClient(client) {
        setContext(CLIENT, client);
    }

    var restoring = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();

    function query(client, options) {
        var subscribed = false;
        var initial_value;
        // If client is restoring (e.g. from SSR)
        // attempt synchronous readQuery first (to prevent loading in {#await})
        if (restoring.has(client)) {
            try {
                // undefined = skip initial value (not in cache)
                initial_value = client.readQuery(options) || undefined;
                initial_value = { data: initial_value };
            }
            catch (err) {
                // Ignore preload errors
            }
        }
        // Create query and observe,
        // but don't subscribe directly to avoid firing duplicate value if initialized
        var observable_query = client.watchQuery(options);
        var subscribe_to_query = observe(observable_query, initial_value).subscribe;
        // Wrap the query subscription with a readable to prevent duplicate values
        var subscribe = readable(initial_value, function (set) {
            subscribed = true;
            var skip_duplicate = initial_value !== undefined;
            var initialized = false;
            var skipped = false;
            var unsubscribe = subscribe_to_query(function (value) {
                if (skip_duplicate && initialized && !skipped) {
                    skipped = true;
                }
                else {
                    if (!initialized)
                        initialized = true;
                    set(value);
                }
            });
            return unsubscribe;
        }).subscribe;
        return {
            subscribe: subscribe,
            refetch: function (variables) {
                // If variables have not changed and not subscribed, skip refetch
                if (!subscribed && equal(variables, observable_query.variables))
                    return observable_query.result();
                return observable_query.refetch(variables);
            },
            result: function () { return observable_query.result(); },
            fetchMore: function (options) { return observable_query.fetchMore(options); },
            setOptions: function (options) { return observable_query.setOptions(options); },
            updateQuery: function (map) { return observable_query.updateQuery(map); },
            startPolling: function (interval) { return observable_query.startPolling(interval); },
            stopPolling: function () { return observable_query.stopPolling(); },
            subscribeToMore: function (options) { return observable_query.subscribeToMore(options); }
        };
    }

    function mutate(client, options) {
        return client.mutate(options);
    }
    //# sourceMappingURL=svelte-apollo.es.js.map

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var Observable_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    // === Symbol Support ===

    var hasSymbols = function () {
      return typeof Symbol === 'function';
    };
    var hasSymbol = function (name) {
      return hasSymbols() && Boolean(Symbol[name]);
    };
    var getSymbol = function (name) {
      return hasSymbol(name) ? Symbol[name] : '@@' + name;
    };

    if (hasSymbols() && !hasSymbol('observable')) {
      Symbol.observable = Symbol('observable');
    }

    var SymbolIterator = getSymbol('iterator');
    var SymbolObservable = getSymbol('observable');
    var SymbolSpecies = getSymbol('species');

    // === Abstract Operations ===

    function getMethod(obj, key) {
      var value = obj[key];

      if (value == null) return undefined;

      if (typeof value !== 'function') throw new TypeError(value + ' is not a function');

      return value;
    }

    function getSpecies(obj) {
      var ctor = obj.constructor;
      if (ctor !== undefined) {
        ctor = ctor[SymbolSpecies];
        if (ctor === null) {
          ctor = undefined;
        }
      }
      return ctor !== undefined ? ctor : Observable;
    }

    function isObservable(x) {
      return x instanceof Observable; // SPEC: Brand check
    }

    function hostReportError(e) {
      if (hostReportError.log) {
        hostReportError.log(e);
      } else {
        setTimeout(function () {
          throw e;
        });
      }
    }

    function enqueue(fn) {
      Promise.resolve().then(function () {
        try {
          fn();
        } catch (e) {
          hostReportError(e);
        }
      });
    }

    function cleanupSubscription(subscription) {
      var cleanup = subscription._cleanup;
      if (cleanup === undefined) return;

      subscription._cleanup = undefined;

      if (!cleanup) {
        return;
      }

      try {
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          var unsubscribe = getMethod(cleanup, 'unsubscribe');
          if (unsubscribe) {
            unsubscribe.call(cleanup);
          }
        }
      } catch (e) {
        hostReportError(e);
      }
    }

    function closeSubscription(subscription) {
      subscription._observer = undefined;
      subscription._queue = undefined;
      subscription._state = 'closed';
    }

    function flushSubscription(subscription) {
      var queue = subscription._queue;
      if (!queue) {
        return;
      }
      subscription._queue = undefined;
      subscription._state = 'ready';
      for (var i = 0; i < queue.length; ++i) {
        notifySubscription(subscription, queue[i].type, queue[i].value);
        if (subscription._state === 'closed') break;
      }
    }

    function notifySubscription(subscription, type, value) {
      subscription._state = 'running';

      var observer = subscription._observer;

      try {
        var m = getMethod(observer, type);
        switch (type) {
          case 'next':
            if (m) m.call(observer, value);
            break;
          case 'error':
            closeSubscription(subscription);
            if (m) m.call(observer, value);else throw value;
            break;
          case 'complete':
            closeSubscription(subscription);
            if (m) m.call(observer);
            break;
        }
      } catch (e) {
        hostReportError(e);
      }

      if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
    }

    function onNotify(subscription, type, value) {
      if (subscription._state === 'closed') return;

      if (subscription._state === 'buffering') {
        subscription._queue.push({ type: type, value: value });
        return;
      }

      if (subscription._state !== 'ready') {
        subscription._state = 'buffering';
        subscription._queue = [{ type: type, value: value }];
        enqueue(function () {
          return flushSubscription(subscription);
        });
        return;
      }

      notifySubscription(subscription, type, value);
    }

    var Subscription = function () {
      function Subscription(observer, subscriber) {
        _classCallCheck(this, Subscription);

        // ASSERT: observer is an object
        // ASSERT: subscriber is callable

        this._cleanup = undefined;
        this._observer = observer;
        this._queue = undefined;
        this._state = 'initializing';

        var subscriptionObserver = new SubscriptionObserver(this);

        try {
          this._cleanup = subscriber.call(undefined, subscriptionObserver);
        } catch (e) {
          subscriptionObserver.error(e);
        }

        if (this._state === 'initializing') this._state = 'ready';
      }

      _createClass(Subscription, [{
        key: 'unsubscribe',
        value: function unsubscribe() {
          if (this._state !== 'closed') {
            closeSubscription(this);
            cleanupSubscription(this);
          }
        }
      }, {
        key: 'closed',
        get: function () {
          return this._state === 'closed';
        }
      }]);

      return Subscription;
    }();

    var SubscriptionObserver = function () {
      function SubscriptionObserver(subscription) {
        _classCallCheck(this, SubscriptionObserver);

        this._subscription = subscription;
      }

      _createClass(SubscriptionObserver, [{
        key: 'next',
        value: function next(value) {
          onNotify(this._subscription, 'next', value);
        }
      }, {
        key: 'error',
        value: function error(value) {
          onNotify(this._subscription, 'error', value);
        }
      }, {
        key: 'complete',
        value: function complete() {
          onNotify(this._subscription, 'complete');
        }
      }, {
        key: 'closed',
        get: function () {
          return this._subscription._state === 'closed';
        }
      }]);

      return SubscriptionObserver;
    }();

    var Observable = exports.Observable = function () {
      function Observable(subscriber) {
        _classCallCheck(this, Observable);

        if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');

        if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');

        this._subscriber = subscriber;
      }

      _createClass(Observable, [{
        key: 'subscribe',
        value: function subscribe(observer) {
          if (typeof observer !== 'object' || observer === null) {
            observer = {
              next: observer,
              error: arguments[1],
              complete: arguments[2]
            };
          }
          return new Subscription(observer, this._subscriber);
        }
      }, {
        key: 'forEach',
        value: function forEach(fn) {
          var _this = this;

          return new Promise(function (resolve, reject) {
            if (typeof fn !== 'function') {
              reject(new TypeError(fn + ' is not a function'));
              return;
            }

            function done() {
              subscription.unsubscribe();
              resolve();
            }

            var subscription = _this.subscribe({
              next: function (value) {
                try {
                  fn(value, done);
                } catch (e) {
                  reject(e);
                  subscription.unsubscribe();
                }
              },

              error: reject,
              complete: resolve
            });
          });
        }
      }, {
        key: 'map',
        value: function map(fn) {
          var _this2 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

          var C = getSpecies(this);

          return new C(function (observer) {
            return _this2.subscribe({
              next: function (value) {
                try {
                  value = fn(value);
                } catch (e) {
                  return observer.error(e);
                }
                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: 'filter',
        value: function filter(fn) {
          var _this3 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

          var C = getSpecies(this);

          return new C(function (observer) {
            return _this3.subscribe({
              next: function (value) {
                try {
                  if (!fn(value)) return;
                } catch (e) {
                  return observer.error(e);
                }
                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: 'reduce',
        value: function reduce(fn) {
          var _this4 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

          var C = getSpecies(this);
          var hasSeed = arguments.length > 1;
          var hasValue = false;
          var seed = arguments[1];
          var acc = seed;

          return new C(function (observer) {
            return _this4.subscribe({
              next: function (value) {
                var first = !hasValue;
                hasValue = true;

                if (!first || hasSeed) {
                  try {
                    acc = fn(acc, value);
                  } catch (e) {
                    return observer.error(e);
                  }
                } else {
                  acc = value;
                }
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));

                observer.next(acc);
                observer.complete();
              }
            });
          });
        }
      }, {
        key: 'concat',
        value: function concat() {
          var _this5 = this;

          for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
            sources[_key] = arguments[_key];
          }

          var C = getSpecies(this);

          return new C(function (observer) {
            var subscription = void 0;
            var index = 0;

            function startNext(next) {
              subscription = next.subscribe({
                next: function (v) {
                  observer.next(v);
                },
                error: function (e) {
                  observer.error(e);
                },
                complete: function () {
                  if (index === sources.length) {
                    subscription = undefined;
                    observer.complete();
                  } else {
                    startNext(C.from(sources[index++]));
                  }
                }
              });
            }

            startNext(_this5);

            return function () {
              if (subscription) {
                subscription.unsubscribe();
                subscription = undefined;
              }
            };
          });
        }
      }, {
        key: 'flatMap',
        value: function flatMap(fn) {
          var _this6 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

          var C = getSpecies(this);

          return new C(function (observer) {
            var subscriptions = [];

            var outer = _this6.subscribe({
              next: function (value) {
                if (fn) {
                  try {
                    value = fn(value);
                  } catch (e) {
                    return observer.error(e);
                  }
                }

                var inner = C.from(value).subscribe({
                  next: function (value) {
                    observer.next(value);
                  },
                  error: function (e) {
                    observer.error(e);
                  },
                  complete: function () {
                    var i = subscriptions.indexOf(inner);
                    if (i >= 0) subscriptions.splice(i, 1);
                    completeIfDone();
                  }
                });

                subscriptions.push(inner);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                completeIfDone();
              }
            });

            function completeIfDone() {
              if (outer.closed && subscriptions.length === 0) observer.complete();
            }

            return function () {
              subscriptions.forEach(function (s) {
                return s.unsubscribe();
              });
              outer.unsubscribe();
            };
          });
        }
      }, {
        key: SymbolObservable,
        value: function () {
          return this;
        }
      }], [{
        key: 'from',
        value: function from(x) {
          var C = typeof this === 'function' ? this : Observable;

          if (x == null) throw new TypeError(x + ' is not an object');

          var method = getMethod(x, SymbolObservable);
          if (method) {
            var observable = method.call(x);

            if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');

            if (isObservable(observable) && observable.constructor === C) return observable;

            return new C(function (observer) {
              return observable.subscribe(observer);
            });
          }

          if (hasSymbol('iterator')) {
            method = getMethod(x, SymbolIterator);
            if (method) {
              return new C(function (observer) {
                enqueue(function () {
                  if (observer.closed) return;
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var item = _step.value;

                      observer.next(item);
                      if (observer.closed) return;
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  observer.complete();
                });
              });
            }
          }

          if (Array.isArray(x)) {
            return new C(function (observer) {
              enqueue(function () {
                if (observer.closed) return;
                for (var i = 0; i < x.length; ++i) {
                  observer.next(x[i]);
                  if (observer.closed) return;
                }
                observer.complete();
              });
            });
          }

          throw new TypeError(x + ' is not observable');
        }
      }, {
        key: 'of',
        value: function of() {
          for (var _len2 = arguments.length, items = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            items[_key2] = arguments[_key2];
          }

          var C = typeof this === 'function' ? this : Observable;

          return new C(function (observer) {
            enqueue(function () {
              if (observer.closed) return;
              for (var i = 0; i < items.length; ++i) {
                observer.next(items[i]);
                if (observer.closed) return;
              }
              observer.complete();
            });
          });
        }
      }, {
        key: SymbolSpecies,
        get: function () {
          return this;
        }
      }]);

      return Observable;
    }();

    if (hasSymbols()) {
      Object.defineProperty(Observable, Symbol('extensions'), {
        value: {
          symbol: SymbolObservable,
          hostReportError: hostReportError
        },
        configurable: true
      });
    }
    });

    unwrapExports(Observable_1);
    var Observable_2 = Observable_1.Observable;

    var zenObservable = Observable_1.Observable;

    var Observable = zenObservable;
    //# sourceMappingURL=bundle.esm.js.map

    function validateOperation(operation) {
        var OPERATION_FIELDS = [
            'query',
            'operationName',
            'variables',
            'extensions',
            'context',
        ];
        for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
            var key = _a[_i];
            if (OPERATION_FIELDS.indexOf(key) < 0) {
                throw process.env.NODE_ENV === "production" ? new InvariantError(2) : new InvariantError("illegal argument: " + key);
            }
        }
        return operation;
    }
    var LinkError = (function (_super) {
        __extends(LinkError, _super);
        function LinkError(message, link) {
            var _this = _super.call(this, message) || this;
            _this.link = link;
            return _this;
        }
        return LinkError;
    }(Error));
    function isTerminating(link) {
        return link.request.length <= 1;
    }
    function fromError(errorValue) {
        return new Observable(function (observer) {
            observer.error(errorValue);
        });
    }
    function transformOperation(operation) {
        var transformedOperation = {
            variables: operation.variables || {},
            extensions: operation.extensions || {},
            operationName: operation.operationName,
            query: operation.query,
        };
        if (!transformedOperation.operationName) {
            transformedOperation.operationName =
                typeof transformedOperation.query !== 'string'
                    ? getOperationName(transformedOperation.query)
                    : '';
        }
        return transformedOperation;
    }
    function createOperation(starting, operation) {
        var context = __assign({}, starting);
        var setContext = function (next) {
            if (typeof next === 'function') {
                context = __assign({}, context, next(context));
            }
            else {
                context = __assign({}, context, next);
            }
        };
        var getContext = function () { return (__assign({}, context)); };
        Object.defineProperty(operation, 'setContext', {
            enumerable: false,
            value: setContext,
        });
        Object.defineProperty(operation, 'getContext', {
            enumerable: false,
            value: getContext,
        });
        Object.defineProperty(operation, 'toKey', {
            enumerable: false,
            value: function () { return getKey(operation); },
        });
        return operation;
    }
    function getKey(operation) {
        var query = operation.query, variables = operation.variables, operationName = operation.operationName;
        return JSON.stringify([operationName, query, variables]);
    }

    function passthrough(op, forward) {
        return forward ? forward(op) : Observable.of();
    }
    function toLink(handler) {
        return typeof handler === 'function' ? new ApolloLink(handler) : handler;
    }
    function empty$1() {
        return new ApolloLink(function () { return Observable.of(); });
    }
    function from(links) {
        if (links.length === 0)
            return empty$1();
        return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
    }
    function split(test, left, right) {
        var leftLink = toLink(left);
        var rightLink = toLink(right || new ApolloLink(passthrough));
        if (isTerminating(leftLink) && isTerminating(rightLink)) {
            return new ApolloLink(function (operation) {
                return test(operation)
                    ? leftLink.request(operation) || Observable.of()
                    : rightLink.request(operation) || Observable.of();
            });
        }
        else {
            return new ApolloLink(function (operation, forward) {
                return test(operation)
                    ? leftLink.request(operation, forward) || Observable.of()
                    : rightLink.request(operation, forward) || Observable.of();
            });
        }
    }
    var concat = function (first, second) {
        var firstLink = toLink(first);
        if (isTerminating(firstLink)) {
            process.env.NODE_ENV === "production" || invariant.warn(new LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
            return firstLink;
        }
        var nextLink = toLink(second);
        if (isTerminating(nextLink)) {
            return new ApolloLink(function (operation) {
                return firstLink.request(operation, function (op) { return nextLink.request(op) || Observable.of(); }) || Observable.of();
            });
        }
        else {
            return new ApolloLink(function (operation, forward) {
                return (firstLink.request(operation, function (op) {
                    return nextLink.request(op, forward) || Observable.of();
                }) || Observable.of());
            });
        }
    };
    var ApolloLink = (function () {
        function ApolloLink(request) {
            if (request)
                this.request = request;
        }
        ApolloLink.prototype.split = function (test, left, right) {
            return this.concat(split(test, left, right || new ApolloLink(passthrough)));
        };
        ApolloLink.prototype.concat = function (next) {
            return concat(this, next);
        };
        ApolloLink.prototype.request = function (operation, forward) {
            throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError('request is not implemented');
        };
        ApolloLink.empty = empty$1;
        ApolloLink.from = from;
        ApolloLink.split = split;
        ApolloLink.execute = execute;
        return ApolloLink;
    }());
    function execute(link, operation) {
        return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || Observable.of());
    }
    //# sourceMappingURL=bundle.esm.js.map

    function symbolObservablePonyfill(root) {
    	var result;
    	var Symbol = root.Symbol;

    	if (typeof Symbol === 'function') {
    		if (Symbol.observable) {
    			result = Symbol.observable;
    		} else {
    			result = Symbol('observable');
    			Symbol.observable = result;
    		}
    	} else {
    		result = '@@observable';
    	}

    	return result;
    }

    /* global window */

    var root;

    if (typeof self !== 'undefined') {
      root = self;
    } else if (typeof window !== 'undefined') {
      root = window;
    } else if (typeof global !== 'undefined') {
      root = global;
    } else if (typeof module !== 'undefined') {
      root = module;
    } else {
      root = Function('return this')();
    }

    var result = symbolObservablePonyfill(root);

    var NetworkStatus;
    (function (NetworkStatus) {
        NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
        NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
        NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
        NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
        NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
        NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
        NetworkStatus[NetworkStatus["error"] = 8] = "error";
    })(NetworkStatus || (NetworkStatus = {}));
    function isNetworkRequestInFlight(networkStatus) {
        return networkStatus < 7;
    }

    var Observable$1 = (function (_super) {
        __extends(Observable, _super);
        function Observable() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Observable.prototype[result] = function () {
            return this;
        };
        Observable.prototype['@@observable'] = function () {
            return this;
        };
        return Observable;
    }(Observable));

    function isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function isApolloError(err) {
        return err.hasOwnProperty('graphQLErrors');
    }
    var generateErrorMessage = function (err) {
        var message = '';
        if (isNonEmptyArray(err.graphQLErrors)) {
            err.graphQLErrors.forEach(function (graphQLError) {
                var errorMessage = graphQLError
                    ? graphQLError.message
                    : 'Error message not found.';
                message += "GraphQL error: " + errorMessage + "\n";
            });
        }
        if (err.networkError) {
            message += 'Network error: ' + err.networkError.message + '\n';
        }
        message = message.replace(/\n$/, '');
        return message;
    };
    var ApolloError = (function (_super) {
        __extends(ApolloError, _super);
        function ApolloError(_a) {
            var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError, errorMessage = _a.errorMessage, extraInfo = _a.extraInfo;
            var _this = _super.call(this, errorMessage) || this;
            _this.graphQLErrors = graphQLErrors || [];
            _this.networkError = networkError || null;
            if (!errorMessage) {
                _this.message = generateErrorMessage(_this);
            }
            else {
                _this.message = errorMessage;
            }
            _this.extraInfo = extraInfo;
            _this.__proto__ = ApolloError.prototype;
            return _this;
        }
        return ApolloError;
    }(Error));

    var FetchType;
    (function (FetchType) {
        FetchType[FetchType["normal"] = 1] = "normal";
        FetchType[FetchType["refetch"] = 2] = "refetch";
        FetchType[FetchType["poll"] = 3] = "poll";
    })(FetchType || (FetchType = {}));

    var hasError = function (storeValue, policy) {
        if (policy === void 0) { policy = 'none'; }
        return storeValue && (storeValue.networkError ||
            (policy === 'none' && isNonEmptyArray(storeValue.graphQLErrors)));
    };
    var ObservableQuery = (function (_super) {
        __extends(ObservableQuery, _super);
        function ObservableQuery(_a) {
            var queryManager = _a.queryManager, options = _a.options, _b = _a.shouldSubscribe, shouldSubscribe = _b === void 0 ? true : _b;
            var _this = _super.call(this, function (observer) {
                return _this.onSubscribe(observer);
            }) || this;
            _this.observers = new Set();
            _this.subscriptions = new Set();
            _this.isTornDown = false;
            _this.options = options;
            _this.variables = options.variables || {};
            _this.queryId = queryManager.generateQueryId();
            _this.shouldSubscribe = shouldSubscribe;
            var opDef = getOperationDefinition(options.query);
            _this.queryName = opDef && opDef.name && opDef.name.value;
            _this.queryManager = queryManager;
            return _this;
        }
        ObservableQuery.prototype.result = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var observer = {
                    next: function (result) {
                        resolve(result);
                        _this.observers.delete(observer);
                        if (!_this.observers.size) {
                            _this.queryManager.removeQuery(_this.queryId);
                        }
                        setTimeout(function () {
                            subscription.unsubscribe();
                        }, 0);
                    },
                    error: reject,
                };
                var subscription = _this.subscribe(observer);
            });
        };
        ObservableQuery.prototype.currentResult = function () {
            var result = this.getCurrentResult();
            if (result.data === undefined) {
                result.data = {};
            }
            return result;
        };
        ObservableQuery.prototype.getCurrentResult = function () {
            if (this.isTornDown) {
                var lastResult = this.lastResult;
                return {
                    data: !this.lastError && lastResult && lastResult.data || void 0,
                    error: this.lastError,
                    loading: false,
                    networkStatus: NetworkStatus.error,
                };
            }
            var _a = this.queryManager.getCurrentQueryResult(this), data = _a.data, partial = _a.partial;
            var queryStoreValue = this.queryManager.queryStore.get(this.queryId);
            var result;
            var fetchPolicy = this.options.fetchPolicy;
            var isNetworkFetchPolicy = fetchPolicy === 'network-only' ||
                fetchPolicy === 'no-cache';
            if (queryStoreValue) {
                var networkStatus = queryStoreValue.networkStatus;
                if (hasError(queryStoreValue, this.options.errorPolicy)) {
                    return {
                        data: void 0,
                        loading: false,
                        networkStatus: networkStatus,
                        error: new ApolloError({
                            graphQLErrors: queryStoreValue.graphQLErrors,
                            networkError: queryStoreValue.networkError,
                        }),
                    };
                }
                if (queryStoreValue.variables) {
                    this.options.variables = __assign({}, this.options.variables, queryStoreValue.variables);
                    this.variables = this.options.variables;
                }
                result = {
                    data: data,
                    loading: isNetworkRequestInFlight(networkStatus),
                    networkStatus: networkStatus,
                };
                if (queryStoreValue.graphQLErrors && this.options.errorPolicy === 'all') {
                    result.errors = queryStoreValue.graphQLErrors;
                }
            }
            else {
                var loading = isNetworkFetchPolicy ||
                    (partial && fetchPolicy !== 'cache-only');
                result = {
                    data: data,
                    loading: loading,
                    networkStatus: loading ? NetworkStatus.loading : NetworkStatus.ready,
                };
            }
            if (!partial) {
                this.updateLastResult(__assign({}, result, { stale: false }));
            }
            return __assign({}, result, { partial: partial });
        };
        ObservableQuery.prototype.isDifferentFromLastResult = function (newResult) {
            var snapshot = this.lastResultSnapshot;
            return !(snapshot &&
                newResult &&
                snapshot.networkStatus === newResult.networkStatus &&
                snapshot.stale === newResult.stale &&
                equal(snapshot.data, newResult.data));
        };
        ObservableQuery.prototype.getLastResult = function () {
            return this.lastResult;
        };
        ObservableQuery.prototype.getLastError = function () {
            return this.lastError;
        };
        ObservableQuery.prototype.resetLastResults = function () {
            delete this.lastResult;
            delete this.lastResultSnapshot;
            delete this.lastError;
            this.isTornDown = false;
        };
        ObservableQuery.prototype.resetQueryStoreErrors = function () {
            var queryStore = this.queryManager.queryStore.get(this.queryId);
            if (queryStore) {
                queryStore.networkError = null;
                queryStore.graphQLErrors = [];
            }
        };
        ObservableQuery.prototype.refetch = function (variables) {
            var fetchPolicy = this.options.fetchPolicy;
            if (fetchPolicy === 'cache-only') {
                return Promise.reject(process.env.NODE_ENV === "production" ? new InvariantError(3) : new InvariantError('cache-only fetchPolicy option should not be used together with query refetch.'));
            }
            if (fetchPolicy !== 'no-cache' &&
                fetchPolicy !== 'cache-and-network') {
                fetchPolicy = 'network-only';
            }
            if (!equal(this.variables, variables)) {
                this.variables = __assign({}, this.variables, variables);
            }
            if (!equal(this.options.variables, this.variables)) {
                this.options.variables = __assign({}, this.options.variables, this.variables);
            }
            return this.queryManager.fetchQuery(this.queryId, __assign({}, this.options, { fetchPolicy: fetchPolicy }), FetchType.refetch);
        };
        ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
            var _this = this;
            process.env.NODE_ENV === "production" ? invariant(fetchMoreOptions.updateQuery, 4) : invariant(fetchMoreOptions.updateQuery, 'updateQuery option is required. This function defines how to update the query data with the new results.');
            var combinedOptions = __assign({}, (fetchMoreOptions.query ? fetchMoreOptions : __assign({}, this.options, fetchMoreOptions, { variables: __assign({}, this.variables, fetchMoreOptions.variables) })), { fetchPolicy: 'network-only' });
            var qid = this.queryManager.generateQueryId();
            return this.queryManager
                .fetchQuery(qid, combinedOptions, FetchType.normal, this.queryId)
                .then(function (fetchMoreResult) {
                _this.updateQuery(function (previousResult) {
                    return fetchMoreOptions.updateQuery(previousResult, {
                        fetchMoreResult: fetchMoreResult.data,
                        variables: combinedOptions.variables,
                    });
                });
                _this.queryManager.stopQuery(qid);
                return fetchMoreResult;
            }, function (error) {
                _this.queryManager.stopQuery(qid);
                throw error;
            });
        };
        ObservableQuery.prototype.subscribeToMore = function (options) {
            var _this = this;
            var subscription = this.queryManager
                .startGraphQLSubscription({
                query: options.document,
                variables: options.variables,
            })
                .subscribe({
                next: function (subscriptionData) {
                    var updateQuery = options.updateQuery;
                    if (updateQuery) {
                        _this.updateQuery(function (previous, _a) {
                            var variables = _a.variables;
                            return updateQuery(previous, {
                                subscriptionData: subscriptionData,
                                variables: variables,
                            });
                        });
                    }
                },
                error: function (err) {
                    if (options.onError) {
                        options.onError(err);
                        return;
                    }
                    process.env.NODE_ENV === "production" || invariant.error('Unhandled GraphQL subscription error', err);
                },
            });
            this.subscriptions.add(subscription);
            return function () {
                if (_this.subscriptions.delete(subscription)) {
                    subscription.unsubscribe();
                }
            };
        };
        ObservableQuery.prototype.setOptions = function (opts) {
            var oldFetchPolicy = this.options.fetchPolicy;
            this.options = __assign({}, this.options, opts);
            if (opts.pollInterval) {
                this.startPolling(opts.pollInterval);
            }
            else if (opts.pollInterval === 0) {
                this.stopPolling();
            }
            var fetchPolicy = opts.fetchPolicy;
            return this.setVariables(this.options.variables, oldFetchPolicy !== fetchPolicy && (oldFetchPolicy === 'cache-only' ||
                oldFetchPolicy === 'standby' ||
                fetchPolicy === 'network-only'), opts.fetchResults);
        };
        ObservableQuery.prototype.setVariables = function (variables, tryFetch, fetchResults) {
            if (tryFetch === void 0) { tryFetch = false; }
            if (fetchResults === void 0) { fetchResults = true; }
            this.isTornDown = false;
            variables = variables || this.variables;
            if (!tryFetch && equal(variables, this.variables)) {
                return this.observers.size && fetchResults
                    ? this.result()
                    : Promise.resolve();
            }
            this.variables = this.options.variables = variables;
            if (!this.observers.size) {
                return Promise.resolve();
            }
            return this.queryManager.fetchQuery(this.queryId, this.options);
        };
        ObservableQuery.prototype.updateQuery = function (mapFn) {
            var queryManager = this.queryManager;
            var _a = queryManager.getQueryWithPreviousResult(this.queryId), previousResult = _a.previousResult, variables = _a.variables, document = _a.document;
            var newResult = tryFunctionOrLogError(function () {
                return mapFn(previousResult, { variables: variables });
            });
            if (newResult) {
                queryManager.dataStore.markUpdateQueryResult(document, variables, newResult);
                queryManager.broadcastQueries();
            }
        };
        ObservableQuery.prototype.stopPolling = function () {
            this.queryManager.stopPollingQuery(this.queryId);
            this.options.pollInterval = undefined;
        };
        ObservableQuery.prototype.startPolling = function (pollInterval) {
            assertNotCacheFirstOrOnly(this);
            this.options.pollInterval = pollInterval;
            this.queryManager.startPollingQuery(this.options, this.queryId);
        };
        ObservableQuery.prototype.updateLastResult = function (newResult) {
            var previousResult = this.lastResult;
            this.lastResult = newResult;
            this.lastResultSnapshot = this.queryManager.assumeImmutableResults
                ? newResult
                : cloneDeep(newResult);
            return previousResult;
        };
        ObservableQuery.prototype.onSubscribe = function (observer) {
            var _this = this;
            try {
                var subObserver = observer._subscription._observer;
                if (subObserver && !subObserver.error) {
                    subObserver.error = defaultSubscriptionObserverErrorCallback;
                }
            }
            catch (_a) { }
            var first = !this.observers.size;
            this.observers.add(observer);
            if (observer.next && this.lastResult)
                observer.next(this.lastResult);
            if (observer.error && this.lastError)
                observer.error(this.lastError);
            if (first) {
                this.setUpQuery();
            }
            return function () {
                if (_this.observers.delete(observer) && !_this.observers.size) {
                    _this.tearDownQuery();
                }
            };
        };
        ObservableQuery.prototype.setUpQuery = function () {
            var _this = this;
            var _a = this, queryManager = _a.queryManager, queryId = _a.queryId;
            if (this.shouldSubscribe) {
                queryManager.addObservableQuery(queryId, this);
            }
            if (this.options.pollInterval) {
                assertNotCacheFirstOrOnly(this);
                queryManager.startPollingQuery(this.options, queryId);
            }
            var onError = function (error) {
                _this.updateLastResult(__assign({}, _this.lastResult, { errors: error.graphQLErrors, networkStatus: NetworkStatus.error, loading: false }));
                iterateObserversSafely(_this.observers, 'error', _this.lastError = error);
            };
            queryManager.observeQuery(queryId, this.options, {
                next: function (result) {
                    if (_this.lastError || _this.isDifferentFromLastResult(result)) {
                        var previousResult_1 = _this.updateLastResult(result);
                        var _a = _this.options, query_1 = _a.query, variables = _a.variables, fetchPolicy_1 = _a.fetchPolicy;
                        if (queryManager.transform(query_1).hasClientExports) {
                            queryManager.getLocalState().addExportedVariables(query_1, variables).then(function (variables) {
                                var previousVariables = _this.variables;
                                _this.variables = _this.options.variables = variables;
                                if (!result.loading &&
                                    previousResult_1 &&
                                    fetchPolicy_1 !== 'cache-only' &&
                                    queryManager.transform(query_1).serverQuery &&
                                    !equal(previousVariables, variables)) {
                                    _this.refetch();
                                }
                                else {
                                    iterateObserversSafely(_this.observers, 'next', result);
                                }
                            });
                        }
                        else {
                            iterateObserversSafely(_this.observers, 'next', result);
                        }
                    }
                },
                error: onError,
            }).catch(onError);
        };
        ObservableQuery.prototype.tearDownQuery = function () {
            var queryManager = this.queryManager;
            this.isTornDown = true;
            queryManager.stopPollingQuery(this.queryId);
            this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
            this.subscriptions.clear();
            queryManager.removeObservableQuery(this.queryId);
            queryManager.stopQuery(this.queryId);
            this.observers.clear();
        };
        return ObservableQuery;
    }(Observable$1));
    function defaultSubscriptionObserverErrorCallback(error) {
        process.env.NODE_ENV === "production" || invariant.error('Unhandled error', error.message, error.stack);
    }
    function iterateObserversSafely(observers, method, argument) {
        var observersWithMethod = [];
        observers.forEach(function (obs) { return obs[method] && observersWithMethod.push(obs); });
        observersWithMethod.forEach(function (obs) { return obs[method](argument); });
    }
    function assertNotCacheFirstOrOnly(obsQuery) {
        var fetchPolicy = obsQuery.options.fetchPolicy;
        process.env.NODE_ENV === "production" ? invariant(fetchPolicy !== 'cache-first' && fetchPolicy !== 'cache-only', 5) : invariant(fetchPolicy !== 'cache-first' && fetchPolicy !== 'cache-only', 'Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
    }

    var MutationStore = (function () {
        function MutationStore() {
            this.store = {};
        }
        MutationStore.prototype.getStore = function () {
            return this.store;
        };
        MutationStore.prototype.get = function (mutationId) {
            return this.store[mutationId];
        };
        MutationStore.prototype.initMutation = function (mutationId, mutation, variables) {
            this.store[mutationId] = {
                mutation: mutation,
                variables: variables || {},
                loading: true,
                error: null,
            };
        };
        MutationStore.prototype.markMutationError = function (mutationId, error) {
            var mutation = this.store[mutationId];
            if (mutation) {
                mutation.loading = false;
                mutation.error = error;
            }
        };
        MutationStore.prototype.markMutationResult = function (mutationId) {
            var mutation = this.store[mutationId];
            if (mutation) {
                mutation.loading = false;
                mutation.error = null;
            }
        };
        MutationStore.prototype.reset = function () {
            this.store = {};
        };
        return MutationStore;
    }());

    var QueryStore = (function () {
        function QueryStore() {
            this.store = {};
        }
        QueryStore.prototype.getStore = function () {
            return this.store;
        };
        QueryStore.prototype.get = function (queryId) {
            return this.store[queryId];
        };
        QueryStore.prototype.initQuery = function (query) {
            var previousQuery = this.store[query.queryId];
            process.env.NODE_ENV === "production" ? invariant(!previousQuery ||
                previousQuery.document === query.document ||
                equal(previousQuery.document, query.document), 19) : invariant(!previousQuery ||
                previousQuery.document === query.document ||
                equal(previousQuery.document, query.document), 'Internal Error: may not update existing query string in store');
            var isSetVariables = false;
            var previousVariables = null;
            if (query.storePreviousVariables &&
                previousQuery &&
                previousQuery.networkStatus !== NetworkStatus.loading) {
                if (!equal(previousQuery.variables, query.variables)) {
                    isSetVariables = true;
                    previousVariables = previousQuery.variables;
                }
            }
            var networkStatus;
            if (isSetVariables) {
                networkStatus = NetworkStatus.setVariables;
            }
            else if (query.isPoll) {
                networkStatus = NetworkStatus.poll;
            }
            else if (query.isRefetch) {
                networkStatus = NetworkStatus.refetch;
            }
            else {
                networkStatus = NetworkStatus.loading;
            }
            var graphQLErrors = [];
            if (previousQuery && previousQuery.graphQLErrors) {
                graphQLErrors = previousQuery.graphQLErrors;
            }
            this.store[query.queryId] = {
                document: query.document,
                variables: query.variables,
                previousVariables: previousVariables,
                networkError: null,
                graphQLErrors: graphQLErrors,
                networkStatus: networkStatus,
                metadata: query.metadata,
            };
            if (typeof query.fetchMoreForQueryId === 'string' &&
                this.store[query.fetchMoreForQueryId]) {
                this.store[query.fetchMoreForQueryId].networkStatus =
                    NetworkStatus.fetchMore;
            }
        };
        QueryStore.prototype.markQueryResult = function (queryId, result, fetchMoreForQueryId) {
            if (!this.store || !this.store[queryId])
                return;
            this.store[queryId].networkError = null;
            this.store[queryId].graphQLErrors = isNonEmptyArray(result.errors) ? result.errors : [];
            this.store[queryId].previousVariables = null;
            this.store[queryId].networkStatus = NetworkStatus.ready;
            if (typeof fetchMoreForQueryId === 'string' &&
                this.store[fetchMoreForQueryId]) {
                this.store[fetchMoreForQueryId].networkStatus = NetworkStatus.ready;
            }
        };
        QueryStore.prototype.markQueryError = function (queryId, error, fetchMoreForQueryId) {
            if (!this.store || !this.store[queryId])
                return;
            this.store[queryId].networkError = error;
            this.store[queryId].networkStatus = NetworkStatus.error;
            if (typeof fetchMoreForQueryId === 'string') {
                this.markQueryResultClient(fetchMoreForQueryId, true);
            }
        };
        QueryStore.prototype.markQueryResultClient = function (queryId, complete) {
            var storeValue = this.store && this.store[queryId];
            if (storeValue) {
                storeValue.networkError = null;
                storeValue.previousVariables = null;
                if (complete) {
                    storeValue.networkStatus = NetworkStatus.ready;
                }
            }
        };
        QueryStore.prototype.stopQuery = function (queryId) {
            delete this.store[queryId];
        };
        QueryStore.prototype.reset = function (observableQueryIds) {
            var _this = this;
            Object.keys(this.store).forEach(function (queryId) {
                if (observableQueryIds.indexOf(queryId) < 0) {
                    _this.stopQuery(queryId);
                }
                else {
                    _this.store[queryId].networkStatus = NetworkStatus.loading;
                }
            });
        };
        return QueryStore;
    }());

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    var LocalState = (function () {
        function LocalState(_a) {
            var cache = _a.cache, client = _a.client, resolvers = _a.resolvers, fragmentMatcher = _a.fragmentMatcher;
            this.cache = cache;
            if (client) {
                this.client = client;
            }
            if (resolvers) {
                this.addResolvers(resolvers);
            }
            if (fragmentMatcher) {
                this.setFragmentMatcher(fragmentMatcher);
            }
        }
        LocalState.prototype.addResolvers = function (resolvers) {
            var _this = this;
            this.resolvers = this.resolvers || {};
            if (Array.isArray(resolvers)) {
                resolvers.forEach(function (resolverGroup) {
                    _this.resolvers = mergeDeep(_this.resolvers, resolverGroup);
                });
            }
            else {
                this.resolvers = mergeDeep(this.resolvers, resolvers);
            }
        };
        LocalState.prototype.setResolvers = function (resolvers) {
            this.resolvers = {};
            this.addResolvers(resolvers);
        };
        LocalState.prototype.getResolvers = function () {
            return this.resolvers || {};
        };
        LocalState.prototype.runResolvers = function (_a) {
            var document = _a.document, remoteResult = _a.remoteResult, context = _a.context, variables = _a.variables, _b = _a.onlyRunForcedResolvers, onlyRunForcedResolvers = _b === void 0 ? false : _b;
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_c) {
                    if (document) {
                        return [2, this.resolveDocument(document, remoteResult.data, context, variables, this.fragmentMatcher, onlyRunForcedResolvers).then(function (localResult) { return (__assign({}, remoteResult, { data: localResult.result })); })];
                    }
                    return [2, remoteResult];
                });
            });
        };
        LocalState.prototype.setFragmentMatcher = function (fragmentMatcher) {
            this.fragmentMatcher = fragmentMatcher;
        };
        LocalState.prototype.getFragmentMatcher = function () {
            return this.fragmentMatcher;
        };
        LocalState.prototype.clientQuery = function (document) {
            if (hasDirectives(['client'], document)) {
                if (this.resolvers) {
                    return document;
                }
                process.env.NODE_ENV === "production" || invariant.warn('Found @client directives in a query but no ApolloClient resolvers ' +
                    'were specified. This means ApolloClient local resolver handling ' +
                    'has been disabled, and @client directives will be passed through ' +
                    'to your link chain.');
            }
            return null;
        };
        LocalState.prototype.serverQuery = function (document) {
            return this.resolvers ? removeClientSetsFromDocument(document) : document;
        };
        LocalState.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var cache = this.cache;
            var newContext = __assign({}, context, { cache: cache, getCacheKey: function (obj) {
                    if (cache.config) {
                        return cache.config.dataIdFromObject(obj);
                    }
                    else {
                        process.env.NODE_ENV === "production" ? invariant(false, 6) : invariant(false, 'To use context.getCacheKey, you need to use a cache that has ' +
                            'a configurable dataIdFromObject, like apollo-cache-inmemory.');
                    }
                } });
            return newContext;
        };
        LocalState.prototype.addExportedVariables = function (document, variables, context) {
            if (variables === void 0) { variables = {}; }
            if (context === void 0) { context = {}; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (document) {
                        return [2, this.resolveDocument(document, this.buildRootValueFromCache(document, variables) || {}, this.prepareContext(context), variables).then(function (data) { return (__assign({}, variables, data.exportedVariables)); })];
                    }
                    return [2, __assign({}, variables)];
                });
            });
        };
        LocalState.prototype.shouldForceResolvers = function (document) {
            var forceResolvers = false;
            visit(document, {
                Directive: {
                    enter: function (node) {
                        if (node.name.value === 'client' && node.arguments) {
                            forceResolvers = node.arguments.some(function (arg) {
                                return arg.name.value === 'always' &&
                                    arg.value.kind === 'BooleanValue' &&
                                    arg.value.value === true;
                            });
                            if (forceResolvers) {
                                return BREAK;
                            }
                        }
                    },
                },
            });
            return forceResolvers;
        };
        LocalState.prototype.buildRootValueFromCache = function (document, variables) {
            return this.cache.diff({
                query: buildQueryFromSelectionSet(document),
                variables: variables,
                returnPartialData: true,
                optimistic: false,
            }).result;
        };
        LocalState.prototype.resolveDocument = function (document, rootValue, context, variables, fragmentMatcher, onlyRunForcedResolvers) {
            if (context === void 0) { context = {}; }
            if (variables === void 0) { variables = {}; }
            if (fragmentMatcher === void 0) { fragmentMatcher = function () { return true; }; }
            if (onlyRunForcedResolvers === void 0) { onlyRunForcedResolvers = false; }
            return __awaiter(this, void 0, void 0, function () {
                var mainDefinition, fragments, fragmentMap, definitionOperation, defaultOperationType, _a, cache, client, execContext;
                return __generator(this, function (_b) {
                    mainDefinition = getMainDefinition(document);
                    fragments = getFragmentDefinitions(document);
                    fragmentMap = createFragmentMap(fragments);
                    definitionOperation = mainDefinition
                        .operation;
                    defaultOperationType = definitionOperation
                        ? capitalizeFirstLetter(definitionOperation)
                        : 'Query';
                    _a = this, cache = _a.cache, client = _a.client;
                    execContext = {
                        fragmentMap: fragmentMap,
                        context: __assign({}, context, { cache: cache,
                            client: client }),
                        variables: variables,
                        fragmentMatcher: fragmentMatcher,
                        defaultOperationType: defaultOperationType,
                        exportedVariables: {},
                        onlyRunForcedResolvers: onlyRunForcedResolvers,
                    };
                    return [2, this.resolveSelectionSet(mainDefinition.selectionSet, rootValue, execContext).then(function (result) { return ({
                            result: result,
                            exportedVariables: execContext.exportedVariables,
                        }); })];
                });
            });
        };
        LocalState.prototype.resolveSelectionSet = function (selectionSet, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var fragmentMap, context, variables, resultsToMerge, execute;
                var _this = this;
                return __generator(this, function (_a) {
                    fragmentMap = execContext.fragmentMap, context = execContext.context, variables = execContext.variables;
                    resultsToMerge = [rootValue];
                    execute = function (selection) { return __awaiter(_this, void 0, void 0, function () {
                        var fragment, typeCondition;
                        return __generator(this, function (_a) {
                            if (!shouldInclude(selection, variables)) {
                                return [2];
                            }
                            if (isField(selection)) {
                                return [2, this.resolveField(selection, rootValue, execContext).then(function (fieldResult) {
                                        var _a;
                                        if (typeof fieldResult !== 'undefined') {
                                            resultsToMerge.push((_a = {},
                                                _a[resultKeyNameFromField(selection)] = fieldResult,
                                                _a));
                                        }
                                    })];
                            }
                            if (isInlineFragment(selection)) {
                                fragment = selection;
                            }
                            else {
                                fragment = fragmentMap[selection.name.value];
                                process.env.NODE_ENV === "production" ? invariant(fragment, 7) : invariant(fragment, "No fragment named " + selection.name.value);
                            }
                            if (fragment && fragment.typeCondition) {
                                typeCondition = fragment.typeCondition.name.value;
                                if (execContext.fragmentMatcher(rootValue, typeCondition, context)) {
                                    return [2, this.resolveSelectionSet(fragment.selectionSet, rootValue, execContext).then(function (fragmentResult) {
                                            resultsToMerge.push(fragmentResult);
                                        })];
                                }
                            }
                            return [2];
                        });
                    }); };
                    return [2, Promise.all(selectionSet.selections.map(execute)).then(function () {
                            return mergeDeepArray(resultsToMerge);
                        })];
                });
            });
        };
        LocalState.prototype.resolveField = function (field, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var variables, fieldName, aliasedFieldName, aliasUsed, defaultResult, resultPromise, resolverType, resolverMap, resolve;
                var _this = this;
                return __generator(this, function (_a) {
                    variables = execContext.variables;
                    fieldName = field.name.value;
                    aliasedFieldName = resultKeyNameFromField(field);
                    aliasUsed = fieldName !== aliasedFieldName;
                    defaultResult = rootValue[aliasedFieldName] || rootValue[fieldName];
                    resultPromise = Promise.resolve(defaultResult);
                    if (!execContext.onlyRunForcedResolvers ||
                        this.shouldForceResolvers(field)) {
                        resolverType = rootValue.__typename || execContext.defaultOperationType;
                        resolverMap = this.resolvers && this.resolvers[resolverType];
                        if (resolverMap) {
                            resolve = resolverMap[aliasUsed ? fieldName : aliasedFieldName];
                            if (resolve) {
                                resultPromise = Promise.resolve(resolve(rootValue, argumentsObjectFromField(field, variables), execContext.context, { field: field }));
                            }
                        }
                    }
                    return [2, resultPromise.then(function (result) {
                            if (result === void 0) { result = defaultResult; }
                            if (field.directives) {
                                field.directives.forEach(function (directive) {
                                    if (directive.name.value === 'export' && directive.arguments) {
                                        directive.arguments.forEach(function (arg) {
                                            if (arg.name.value === 'as' && arg.value.kind === 'StringValue') {
                                                execContext.exportedVariables[arg.value.value] = result;
                                            }
                                        });
                                    }
                                });
                            }
                            if (!field.selectionSet) {
                                return result;
                            }
                            if (result == null) {
                                return result;
                            }
                            if (Array.isArray(result)) {
                                return _this.resolveSubSelectedArray(field, result, execContext);
                            }
                            if (field.selectionSet) {
                                return _this.resolveSelectionSet(field.selectionSet, result, execContext);
                            }
                        })];
                });
            });
        };
        LocalState.prototype.resolveSubSelectedArray = function (field, result, execContext) {
            var _this = this;
            return Promise.all(result.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return _this.resolveSubSelectedArray(field, item, execContext);
                }
                if (field.selectionSet) {
                    return _this.resolveSelectionSet(field.selectionSet, item, execContext);
                }
            }));
        };
        return LocalState;
    }());

    function multiplex(inner) {
        var observers = new Set();
        var sub = null;
        return new Observable$1(function (observer) {
            observers.add(observer);
            sub = sub || inner.subscribe({
                next: function (value) {
                    observers.forEach(function (obs) { return obs.next && obs.next(value); });
                },
                error: function (error) {
                    observers.forEach(function (obs) { return obs.error && obs.error(error); });
                },
                complete: function () {
                    observers.forEach(function (obs) { return obs.complete && obs.complete(); });
                },
            });
            return function () {
                if (observers.delete(observer) && !observers.size && sub) {
                    sub.unsubscribe();
                    sub = null;
                }
            };
        });
    }
    function asyncMap(observable, mapFn) {
        return new Observable$1(function (observer) {
            var next = observer.next, error = observer.error, complete = observer.complete;
            var activeNextCount = 0;
            var completed = false;
            var handler = {
                next: function (value) {
                    ++activeNextCount;
                    new Promise(function (resolve) {
                        resolve(mapFn(value));
                    }).then(function (result) {
                        --activeNextCount;
                        next && next.call(observer, result);
                        completed && handler.complete();
                    }, function (e) {
                        --activeNextCount;
                        error && error.call(observer, e);
                    });
                },
                error: function (e) {
                    error && error.call(observer, e);
                },
                complete: function () {
                    completed = true;
                    if (!activeNextCount) {
                        complete && complete.call(observer);
                    }
                },
            };
            var sub = observable.subscribe(handler);
            return function () { return sub.unsubscribe(); };
        });
    }

    var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
    var QueryManager = (function () {
        function QueryManager(_a) {
            var link = _a.link, _b = _a.queryDeduplication, queryDeduplication = _b === void 0 ? false : _b, store = _a.store, _c = _a.onBroadcast, onBroadcast = _c === void 0 ? function () { return undefined; } : _c, _d = _a.ssrMode, ssrMode = _d === void 0 ? false : _d, _e = _a.clientAwareness, clientAwareness = _e === void 0 ? {} : _e, localState = _a.localState, assumeImmutableResults = _a.assumeImmutableResults;
            this.mutationStore = new MutationStore();
            this.queryStore = new QueryStore();
            this.clientAwareness = {};
            this.idCounter = 1;
            this.queries = new Map();
            this.fetchQueryRejectFns = new Map();
            this.transformCache = new (canUseWeakMap ? WeakMap : Map)();
            this.inFlightLinkObservables = new Map();
            this.pollingInfoByQueryId = new Map();
            this.link = link;
            this.queryDeduplication = queryDeduplication;
            this.dataStore = store;
            this.onBroadcast = onBroadcast;
            this.clientAwareness = clientAwareness;
            this.localState = localState || new LocalState({ cache: store.getCache() });
            this.ssrMode = ssrMode;
            this.assumeImmutableResults = !!assumeImmutableResults;
        }
        QueryManager.prototype.stop = function () {
            var _this = this;
            this.queries.forEach(function (_info, queryId) {
                _this.stopQueryNoBroadcast(queryId);
            });
            this.fetchQueryRejectFns.forEach(function (reject) {
                reject(process.env.NODE_ENV === "production" ? new InvariantError(8) : new InvariantError('QueryManager stopped while query was in flight'));
            });
        };
        QueryManager.prototype.mutate = function (_a) {
            var mutation = _a.mutation, variables = _a.variables, optimisticResponse = _a.optimisticResponse, updateQueriesByName = _a.updateQueries, _b = _a.refetchQueries, refetchQueries = _b === void 0 ? [] : _b, _c = _a.awaitRefetchQueries, awaitRefetchQueries = _c === void 0 ? false : _c, updateWithProxyFn = _a.update, _d = _a.errorPolicy, errorPolicy = _d === void 0 ? 'none' : _d, fetchPolicy = _a.fetchPolicy, _e = _a.context, context = _e === void 0 ? {} : _e;
            return __awaiter(this, void 0, void 0, function () {
                var mutationId, generateUpdateQueriesInfo, self;
                var _this = this;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            process.env.NODE_ENV === "production" ? invariant(mutation, 9) : invariant(mutation, 'mutation option is required. You must specify your GraphQL document in the mutation option.');
                            process.env.NODE_ENV === "production" ? invariant(!fetchPolicy || fetchPolicy === 'no-cache', 10) : invariant(!fetchPolicy || fetchPolicy === 'no-cache', "fetchPolicy for mutations currently only supports the 'no-cache' policy");
                            mutationId = this.generateQueryId();
                            mutation = this.transform(mutation).document;
                            this.setQuery(mutationId, function () { return ({ document: mutation }); });
                            variables = this.getVariables(mutation, variables);
                            if (!this.transform(mutation).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(mutation, variables, context)];
                        case 1:
                            variables = _f.sent();
                            _f.label = 2;
                        case 2:
                            generateUpdateQueriesInfo = function () {
                                var ret = {};
                                if (updateQueriesByName) {
                                    _this.queries.forEach(function (_a, queryId) {
                                        var observableQuery = _a.observableQuery;
                                        if (observableQuery) {
                                            var queryName = observableQuery.queryName;
                                            if (queryName &&
                                                hasOwnProperty$2.call(updateQueriesByName, queryName)) {
                                                ret[queryId] = {
                                                    updater: updateQueriesByName[queryName],
                                                    query: _this.queryStore.get(queryId),
                                                };
                                            }
                                        }
                                    });
                                }
                                return ret;
                            };
                            this.mutationStore.initMutation(mutationId, mutation, variables);
                            this.dataStore.markMutationInit({
                                mutationId: mutationId,
                                document: mutation,
                                variables: variables,
                                updateQueries: generateUpdateQueriesInfo(),
                                update: updateWithProxyFn,
                                optimisticResponse: optimisticResponse,
                            });
                            this.broadcastQueries();
                            self = this;
                            return [2, new Promise(function (resolve, reject) {
                                    var storeResult;
                                    var error;
                                    self.getObservableFromLink(mutation, __assign({}, context, { optimisticResponse: optimisticResponse }), variables, false).subscribe({
                                        next: function (result) {
                                            if (graphQLResultHasError(result) && errorPolicy === 'none') {
                                                error = new ApolloError({
                                                    graphQLErrors: result.errors,
                                                });
                                                return;
                                            }
                                            self.mutationStore.markMutationResult(mutationId);
                                            if (fetchPolicy !== 'no-cache') {
                                                self.dataStore.markMutationResult({
                                                    mutationId: mutationId,
                                                    result: result,
                                                    document: mutation,
                                                    variables: variables,
                                                    updateQueries: generateUpdateQueriesInfo(),
                                                    update: updateWithProxyFn,
                                                });
                                            }
                                            storeResult = result;
                                        },
                                        error: function (err) {
                                            self.mutationStore.markMutationError(mutationId, err);
                                            self.dataStore.markMutationComplete({
                                                mutationId: mutationId,
                                                optimisticResponse: optimisticResponse,
                                            });
                                            self.broadcastQueries();
                                            self.setQuery(mutationId, function () { return ({ document: null }); });
                                            reject(new ApolloError({
                                                networkError: err,
                                            }));
                                        },
                                        complete: function () {
                                            if (error) {
                                                self.mutationStore.markMutationError(mutationId, error);
                                            }
                                            self.dataStore.markMutationComplete({
                                                mutationId: mutationId,
                                                optimisticResponse: optimisticResponse,
                                            });
                                            self.broadcastQueries();
                                            if (error) {
                                                reject(error);
                                                return;
                                            }
                                            if (typeof refetchQueries === 'function') {
                                                refetchQueries = refetchQueries(storeResult);
                                            }
                                            var refetchQueryPromises = [];
                                            if (isNonEmptyArray(refetchQueries)) {
                                                refetchQueries.forEach(function (refetchQuery) {
                                                    if (typeof refetchQuery === 'string') {
                                                        self.queries.forEach(function (_a) {
                                                            var observableQuery = _a.observableQuery;
                                                            if (observableQuery &&
                                                                observableQuery.queryName === refetchQuery) {
                                                                refetchQueryPromises.push(observableQuery.refetch());
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        var queryOptions = {
                                                            query: refetchQuery.query,
                                                            variables: refetchQuery.variables,
                                                            fetchPolicy: 'network-only',
                                                        };
                                                        if (refetchQuery.context) {
                                                            queryOptions.context = refetchQuery.context;
                                                        }
                                                        refetchQueryPromises.push(self.query(queryOptions));
                                                    }
                                                });
                                            }
                                            Promise.all(awaitRefetchQueries ? refetchQueryPromises : []).then(function () {
                                                self.setQuery(mutationId, function () { return ({ document: null }); });
                                                if (errorPolicy === 'ignore' &&
                                                    storeResult &&
                                                    graphQLResultHasError(storeResult)) {
                                                    delete storeResult.errors;
                                                }
                                                resolve(storeResult);
                                            });
                                        },
                                    });
                                })];
                    }
                });
            });
        };
        QueryManager.prototype.fetchQuery = function (queryId, options, fetchType, fetchMoreForQueryId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, metadata, _b, fetchPolicy, _c, context, query, variables, storeResult, isNetworkOnly, needToFetch, _d, complete, result, shouldFetch, requestId, cancel, networkResult;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = options.metadata, metadata = _a === void 0 ? null : _a, _b = options.fetchPolicy, fetchPolicy = _b === void 0 ? 'cache-first' : _b, _c = options.context, context = _c === void 0 ? {} : _c;
                            query = this.transform(options.query).document;
                            variables = this.getVariables(query, options.variables);
                            if (!this.transform(query).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(query, variables, context)];
                        case 1:
                            variables = _e.sent();
                            _e.label = 2;
                        case 2:
                            options = __assign({}, options, { variables: variables });
                            isNetworkOnly = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
                            needToFetch = isNetworkOnly;
                            if (!isNetworkOnly) {
                                _d = this.dataStore.getCache().diff({
                                    query: query,
                                    variables: variables,
                                    returnPartialData: true,
                                    optimistic: false,
                                }), complete = _d.complete, result = _d.result;
                                needToFetch = !complete || fetchPolicy === 'cache-and-network';
                                storeResult = result;
                            }
                            shouldFetch = needToFetch && fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby';
                            if (hasDirectives(['live'], query))
                                shouldFetch = true;
                            requestId = this.idCounter++;
                            cancel = fetchPolicy !== 'no-cache'
                                ? this.updateQueryWatch(queryId, query, options)
                                : undefined;
                            this.setQuery(queryId, function () { return ({
                                document: query,
                                lastRequestId: requestId,
                                invalidated: true,
                                cancel: cancel,
                            }); });
                            this.invalidate(fetchMoreForQueryId);
                            this.queryStore.initQuery({
                                queryId: queryId,
                                document: query,
                                storePreviousVariables: shouldFetch,
                                variables: variables,
                                isPoll: fetchType === FetchType.poll,
                                isRefetch: fetchType === FetchType.refetch,
                                metadata: metadata,
                                fetchMoreForQueryId: fetchMoreForQueryId,
                            });
                            this.broadcastQueries();
                            if (shouldFetch) {
                                networkResult = this.fetchRequest({
                                    requestId: requestId,
                                    queryId: queryId,
                                    document: query,
                                    options: options,
                                    fetchMoreForQueryId: fetchMoreForQueryId,
                                }).catch(function (error) {
                                    if (isApolloError(error)) {
                                        throw error;
                                    }
                                    else {
                                        if (requestId >= _this.getQuery(queryId).lastRequestId) {
                                            _this.queryStore.markQueryError(queryId, error, fetchMoreForQueryId);
                                            _this.invalidate(queryId);
                                            _this.invalidate(fetchMoreForQueryId);
                                            _this.broadcastQueries();
                                        }
                                        throw new ApolloError({ networkError: error });
                                    }
                                });
                                if (fetchPolicy !== 'cache-and-network') {
                                    return [2, networkResult];
                                }
                                networkResult.catch(function () { });
                            }
                            this.queryStore.markQueryResultClient(queryId, !shouldFetch);
                            this.invalidate(queryId);
                            this.invalidate(fetchMoreForQueryId);
                            if (this.transform(query).hasForcedResolvers) {
                                return [2, this.localState.runResolvers({
                                        document: query,
                                        remoteResult: { data: storeResult },
                                        context: context,
                                        variables: variables,
                                        onlyRunForcedResolvers: true,
                                    }).then(function (result) {
                                        _this.markQueryResult(queryId, result, options, fetchMoreForQueryId);
                                        _this.broadcastQueries();
                                        return result;
                                    })];
                            }
                            this.broadcastQueries();
                            return [2, { data: storeResult }];
                    }
                });
            });
        };
        QueryManager.prototype.markQueryResult = function (queryId, result, _a, fetchMoreForQueryId) {
            var fetchPolicy = _a.fetchPolicy, variables = _a.variables, errorPolicy = _a.errorPolicy;
            if (fetchPolicy === 'no-cache') {
                this.setQuery(queryId, function () { return ({
                    newData: { result: result.data, complete: true },
                }); });
            }
            else {
                this.dataStore.markQueryResult(result, this.getQuery(queryId).document, variables, fetchMoreForQueryId, errorPolicy === 'ignore' || errorPolicy === 'all');
            }
        };
        QueryManager.prototype.queryListenerForObserver = function (queryId, options, observer) {
            var _this = this;
            function invoke(method, argument) {
                if (observer[method]) {
                    try {
                        observer[method](argument);
                    }
                    catch (e) {
                        process.env.NODE_ENV === "production" || invariant.error(e);
                    }
                }
                else if (method === 'error') {
                    process.env.NODE_ENV === "production" || invariant.error(argument);
                }
            }
            return function (queryStoreValue, newData) {
                _this.invalidate(queryId, false);
                if (!queryStoreValue)
                    return;
                var _a = _this.getQuery(queryId), observableQuery = _a.observableQuery, document = _a.document;
                var fetchPolicy = observableQuery
                    ? observableQuery.options.fetchPolicy
                    : options.fetchPolicy;
                if (fetchPolicy === 'standby')
                    return;
                var loading = isNetworkRequestInFlight(queryStoreValue.networkStatus);
                var lastResult = observableQuery && observableQuery.getLastResult();
                var networkStatusChanged = !!(lastResult &&
                    lastResult.networkStatus !== queryStoreValue.networkStatus);
                var shouldNotifyIfLoading = options.returnPartialData ||
                    (!newData && queryStoreValue.previousVariables) ||
                    (networkStatusChanged && options.notifyOnNetworkStatusChange) ||
                    fetchPolicy === 'cache-only' ||
                    fetchPolicy === 'cache-and-network';
                if (loading && !shouldNotifyIfLoading) {
                    return;
                }
                var hasGraphQLErrors = isNonEmptyArray(queryStoreValue.graphQLErrors);
                var errorPolicy = observableQuery
                    && observableQuery.options.errorPolicy
                    || options.errorPolicy
                    || 'none';
                if (errorPolicy === 'none' && hasGraphQLErrors || queryStoreValue.networkError) {
                    return invoke('error', new ApolloError({
                        graphQLErrors: queryStoreValue.graphQLErrors,
                        networkError: queryStoreValue.networkError,
                    }));
                }
                try {
                    var data = void 0;
                    var isMissing = void 0;
                    if (newData) {
                        if (fetchPolicy !== 'no-cache' && fetchPolicy !== 'network-only') {
                            _this.setQuery(queryId, function () { return ({ newData: null }); });
                        }
                        data = newData.result;
                        isMissing = !newData.complete;
                    }
                    else {
                        var lastError = observableQuery && observableQuery.getLastError();
                        var errorStatusChanged = errorPolicy !== 'none' &&
                            (lastError && lastError.graphQLErrors) !==
                                queryStoreValue.graphQLErrors;
                        if (lastResult && lastResult.data && !errorStatusChanged) {
                            data = lastResult.data;
                            isMissing = false;
                        }
                        else {
                            var diffResult = _this.dataStore.getCache().diff({
                                query: document,
                                variables: queryStoreValue.previousVariables ||
                                    queryStoreValue.variables,
                                returnPartialData: true,
                                optimistic: true,
                            });
                            data = diffResult.result;
                            isMissing = !diffResult.complete;
                        }
                    }
                    var stale = isMissing && !(options.returnPartialData ||
                        fetchPolicy === 'cache-only');
                    var resultFromStore = {
                        data: stale ? lastResult && lastResult.data : data,
                        loading: loading,
                        networkStatus: queryStoreValue.networkStatus,
                        stale: stale,
                    };
                    if (errorPolicy === 'all' && hasGraphQLErrors) {
                        resultFromStore.errors = queryStoreValue.graphQLErrors;
                    }
                    invoke('next', resultFromStore);
                }
                catch (networkError) {
                    invoke('error', new ApolloError({ networkError: networkError }));
                }
            };
        };
        QueryManager.prototype.transform = function (document) {
            var transformCache = this.transformCache;
            if (!transformCache.has(document)) {
                var cache = this.dataStore.getCache();
                var transformed = cache.transformDocument(document);
                var forLink = removeConnectionDirectiveFromDocument(cache.transformForLink(transformed));
                var clientQuery = this.localState.clientQuery(transformed);
                var serverQuery = this.localState.serverQuery(forLink);
                var cacheEntry_1 = {
                    document: transformed,
                    hasClientExports: hasClientExports(transformed),
                    hasForcedResolvers: this.localState.shouldForceResolvers(transformed),
                    clientQuery: clientQuery,
                    serverQuery: serverQuery,
                    defaultVars: getDefaultValues(getOperationDefinition(transformed)),
                };
                var add = function (doc) {
                    if (doc && !transformCache.has(doc)) {
                        transformCache.set(doc, cacheEntry_1);
                    }
                };
                add(document);
                add(transformed);
                add(clientQuery);
                add(serverQuery);
            }
            return transformCache.get(document);
        };
        QueryManager.prototype.getVariables = function (document, variables) {
            return __assign({}, this.transform(document).defaultVars, variables);
        };
        QueryManager.prototype.watchQuery = function (options, shouldSubscribe) {
            if (shouldSubscribe === void 0) { shouldSubscribe = true; }
            process.env.NODE_ENV === "production" ? invariant(options.fetchPolicy !== 'standby', 11) : invariant(options.fetchPolicy !== 'standby', 'client.watchQuery cannot be called with fetchPolicy set to "standby"');
            options.variables = this.getVariables(options.query, options.variables);
            if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
                options.notifyOnNetworkStatusChange = false;
            }
            var transformedOptions = __assign({}, options);
            return new ObservableQuery({
                queryManager: this,
                options: transformedOptions,
                shouldSubscribe: shouldSubscribe,
            });
        };
        QueryManager.prototype.query = function (options) {
            var _this = this;
            process.env.NODE_ENV === "production" ? invariant(options.query, 12) : invariant(options.query, 'query option is required. You must specify your GraphQL document ' +
                'in the query option.');
            process.env.NODE_ENV === "production" ? invariant(options.query.kind === 'Document', 13) : invariant(options.query.kind === 'Document', 'You must wrap the query string in a "gql" tag.');
            process.env.NODE_ENV === "production" ? invariant(!options.returnPartialData, 14) : invariant(!options.returnPartialData, 'returnPartialData option only supported on watchQuery.');
            process.env.NODE_ENV === "production" ? invariant(!options.pollInterval, 15) : invariant(!options.pollInterval, 'pollInterval option only supported on watchQuery.');
            return new Promise(function (resolve, reject) {
                var watchedQuery = _this.watchQuery(options, false);
                _this.fetchQueryRejectFns.set("query:" + watchedQuery.queryId, reject);
                watchedQuery
                    .result()
                    .then(resolve, reject)
                    .then(function () {
                    return _this.fetchQueryRejectFns.delete("query:" + watchedQuery.queryId);
                });
            });
        };
        QueryManager.prototype.generateQueryId = function () {
            return String(this.idCounter++);
        };
        QueryManager.prototype.stopQueryInStore = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryInStoreNoBroadcast = function (queryId) {
            this.stopPollingQuery(queryId);
            this.queryStore.stopQuery(queryId);
            this.invalidate(queryId);
        };
        QueryManager.prototype.addQueryListener = function (queryId, listener) {
            this.setQuery(queryId, function (_a) {
                var listeners = _a.listeners;
                listeners.add(listener);
                return { invalidated: false };
            });
        };
        QueryManager.prototype.updateQueryWatch = function (queryId, document, options) {
            var _this = this;
            var cancel = this.getQuery(queryId).cancel;
            if (cancel)
                cancel();
            var previousResult = function () {
                var previousResult = null;
                var observableQuery = _this.getQuery(queryId).observableQuery;
                if (observableQuery) {
                    var lastResult = observableQuery.getLastResult();
                    if (lastResult) {
                        previousResult = lastResult.data;
                    }
                }
                return previousResult;
            };
            return this.dataStore.getCache().watch({
                query: document,
                variables: options.variables,
                optimistic: true,
                previousResult: previousResult,
                callback: function (newData) {
                    _this.setQuery(queryId, function () { return ({ invalidated: true, newData: newData }); });
                },
            });
        };
        QueryManager.prototype.addObservableQuery = function (queryId, observableQuery) {
            this.setQuery(queryId, function () { return ({ observableQuery: observableQuery }); });
        };
        QueryManager.prototype.removeObservableQuery = function (queryId) {
            var cancel = this.getQuery(queryId).cancel;
            this.setQuery(queryId, function () { return ({ observableQuery: null }); });
            if (cancel)
                cancel();
        };
        QueryManager.prototype.clearStore = function () {
            this.fetchQueryRejectFns.forEach(function (reject) {
                reject(process.env.NODE_ENV === "production" ? new InvariantError(16) : new InvariantError('Store reset while query was in flight (not completed in link chain)'));
            });
            var resetIds = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery)
                    resetIds.push(queryId);
            });
            this.queryStore.reset(resetIds);
            this.mutationStore.reset();
            return this.dataStore.reset();
        };
        QueryManager.prototype.resetStore = function () {
            var _this = this;
            return this.clearStore().then(function () {
                return _this.reFetchObservableQueries();
            });
        };
        QueryManager.prototype.reFetchObservableQueries = function (includeStandby) {
            var _this = this;
            if (includeStandby === void 0) { includeStandby = false; }
            var observableQueryPromises = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery) {
                    var fetchPolicy = observableQuery.options.fetchPolicy;
                    observableQuery.resetLastResults();
                    if (fetchPolicy !== 'cache-only' &&
                        (includeStandby || fetchPolicy !== 'standby')) {
                        observableQueryPromises.push(observableQuery.refetch());
                    }
                    _this.setQuery(queryId, function () { return ({ newData: null }); });
                    _this.invalidate(queryId);
                }
            });
            this.broadcastQueries();
            return Promise.all(observableQueryPromises);
        };
        QueryManager.prototype.observeQuery = function (queryId, options, observer) {
            this.addQueryListener(queryId, this.queryListenerForObserver(queryId, options, observer));
            return this.fetchQuery(queryId, options);
        };
        QueryManager.prototype.startQuery = function (queryId, options, listener) {
            process.env.NODE_ENV === "production" || invariant.warn("The QueryManager.startQuery method has been deprecated");
            this.addQueryListener(queryId, listener);
            this.fetchQuery(queryId, options)
                .catch(function () { return undefined; });
            return queryId;
        };
        QueryManager.prototype.startGraphQLSubscription = function (_a) {
            var _this = this;
            var query = _a.query, fetchPolicy = _a.fetchPolicy, variables = _a.variables;
            query = this.transform(query).document;
            variables = this.getVariables(query, variables);
            var makeObservable = function (variables) {
                return _this.getObservableFromLink(query, {}, variables, false).map(function (result) {
                    if (!fetchPolicy || fetchPolicy !== 'no-cache') {
                        _this.dataStore.markSubscriptionResult(result, query, variables);
                        _this.broadcastQueries();
                    }
                    if (graphQLResultHasError(result)) {
                        throw new ApolloError({
                            graphQLErrors: result.errors,
                        });
                    }
                    return result;
                });
            };
            if (this.transform(query).hasClientExports) {
                var observablePromise_1 = this.localState.addExportedVariables(query, variables).then(makeObservable);
                return new Observable$1(function (observer) {
                    var sub = null;
                    observablePromise_1.then(function (observable) { return sub = observable.subscribe(observer); }, observer.error);
                    return function () { return sub && sub.unsubscribe(); };
                });
            }
            return makeObservable(variables);
        };
        QueryManager.prototype.stopQuery = function (queryId) {
            this.stopQueryNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryNoBroadcast = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.removeQuery(queryId);
        };
        QueryManager.prototype.removeQuery = function (queryId) {
            this.fetchQueryRejectFns.delete("query:" + queryId);
            this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
            this.getQuery(queryId).subscriptions.forEach(function (x) { return x.unsubscribe(); });
            this.queries.delete(queryId);
        };
        QueryManager.prototype.getCurrentQueryResult = function (observableQuery, optimistic) {
            if (optimistic === void 0) { optimistic = true; }
            var _a = observableQuery.options, variables = _a.variables, query = _a.query, fetchPolicy = _a.fetchPolicy, returnPartialData = _a.returnPartialData;
            var lastResult = observableQuery.getLastResult();
            var newData = this.getQuery(observableQuery.queryId).newData;
            if (newData && newData.complete) {
                return { data: newData.result, partial: false };
            }
            if (fetchPolicy === 'no-cache' || fetchPolicy === 'network-only') {
                return { data: undefined, partial: false };
            }
            var _b = this.dataStore.getCache().diff({
                query: query,
                variables: variables,
                previousResult: lastResult ? lastResult.data : undefined,
                returnPartialData: true,
                optimistic: optimistic,
            }), result = _b.result, complete = _b.complete;
            return {
                data: (complete || returnPartialData) ? result : void 0,
                partial: !complete,
            };
        };
        QueryManager.prototype.getQueryWithPreviousResult = function (queryIdOrObservable) {
            var observableQuery;
            if (typeof queryIdOrObservable === 'string') {
                var foundObserveableQuery = this.getQuery(queryIdOrObservable).observableQuery;
                process.env.NODE_ENV === "production" ? invariant(foundObserveableQuery, 17) : invariant(foundObserveableQuery, "ObservableQuery with this id doesn't exist: " + queryIdOrObservable);
                observableQuery = foundObserveableQuery;
            }
            else {
                observableQuery = queryIdOrObservable;
            }
            var _a = observableQuery.options, variables = _a.variables, query = _a.query;
            return {
                previousResult: this.getCurrentQueryResult(observableQuery, false).data,
                variables: variables,
                document: query,
            };
        };
        QueryManager.prototype.broadcastQueries = function () {
            var _this = this;
            this.onBroadcast();
            this.queries.forEach(function (info, id) {
                if (info.invalidated) {
                    info.listeners.forEach(function (listener) {
                        if (listener) {
                            listener(_this.queryStore.get(id), info.newData);
                        }
                    });
                }
            });
        };
        QueryManager.prototype.getLocalState = function () {
            return this.localState;
        };
        QueryManager.prototype.getObservableFromLink = function (query, context, variables, deduplication) {
            var _this = this;
            if (deduplication === void 0) { deduplication = this.queryDeduplication; }
            var observable;
            var serverQuery = this.transform(query).serverQuery;
            if (serverQuery) {
                var _a = this, inFlightLinkObservables_1 = _a.inFlightLinkObservables, link = _a.link;
                var operation = {
                    query: serverQuery,
                    variables: variables,
                    operationName: getOperationName(serverQuery) || void 0,
                    context: this.prepareContext(__assign({}, context, { forceFetch: !deduplication })),
                };
                context = operation.context;
                if (deduplication) {
                    var byVariables_1 = inFlightLinkObservables_1.get(serverQuery) || new Map();
                    inFlightLinkObservables_1.set(serverQuery, byVariables_1);
                    var varJson_1 = JSON.stringify(variables);
                    observable = byVariables_1.get(varJson_1);
                    if (!observable) {
                        byVariables_1.set(varJson_1, observable = multiplex(execute(link, operation)));
                        var cleanup = function () {
                            byVariables_1.delete(varJson_1);
                            if (!byVariables_1.size)
                                inFlightLinkObservables_1.delete(serverQuery);
                            cleanupSub_1.unsubscribe();
                        };
                        var cleanupSub_1 = observable.subscribe({
                            next: cleanup,
                            error: cleanup,
                            complete: cleanup,
                        });
                    }
                }
                else {
                    observable = multiplex(execute(link, operation));
                }
            }
            else {
                observable = Observable$1.of({ data: {} });
                context = this.prepareContext(context);
            }
            var clientQuery = this.transform(query).clientQuery;
            if (clientQuery) {
                observable = asyncMap(observable, function (result) {
                    return _this.localState.runResolvers({
                        document: clientQuery,
                        remoteResult: result,
                        context: context,
                        variables: variables,
                    });
                });
            }
            return observable;
        };
        QueryManager.prototype.fetchRequest = function (_a) {
            var _this = this;
            var requestId = _a.requestId, queryId = _a.queryId, document = _a.document, options = _a.options, fetchMoreForQueryId = _a.fetchMoreForQueryId;
            var variables = options.variables, _b = options.errorPolicy, errorPolicy = _b === void 0 ? 'none' : _b, fetchPolicy = options.fetchPolicy;
            var resultFromStore;
            var errorsFromStore;
            return new Promise(function (resolve, reject) {
                var observable = _this.getObservableFromLink(document, options.context, variables);
                var fqrfId = "fetchRequest:" + queryId;
                _this.fetchQueryRejectFns.set(fqrfId, reject);
                var cleanup = function () {
                    _this.fetchQueryRejectFns.delete(fqrfId);
                    _this.setQuery(queryId, function (_a) {
                        var subscriptions = _a.subscriptions;
                        subscriptions.delete(subscription);
                    });
                };
                var subscription = observable.map(function (result) {
                    if (requestId >= _this.getQuery(queryId).lastRequestId) {
                        _this.markQueryResult(queryId, result, options, fetchMoreForQueryId);
                        _this.queryStore.markQueryResult(queryId, result, fetchMoreForQueryId);
                        _this.invalidate(queryId);
                        _this.invalidate(fetchMoreForQueryId);
                        _this.broadcastQueries();
                    }
                    if (errorPolicy === 'none' && isNonEmptyArray(result.errors)) {
                        return reject(new ApolloError({
                            graphQLErrors: result.errors,
                        }));
                    }
                    if (errorPolicy === 'all') {
                        errorsFromStore = result.errors;
                    }
                    if (fetchMoreForQueryId || fetchPolicy === 'no-cache') {
                        resultFromStore = result.data;
                    }
                    else {
                        var _a = _this.dataStore.getCache().diff({
                            variables: variables,
                            query: document,
                            optimistic: false,
                            returnPartialData: true,
                        }), result_1 = _a.result, complete = _a.complete;
                        if (complete || options.returnPartialData) {
                            resultFromStore = result_1;
                        }
                    }
                }).subscribe({
                    error: function (error) {
                        cleanup();
                        reject(error);
                    },
                    complete: function () {
                        cleanup();
                        resolve({
                            data: resultFromStore,
                            errors: errorsFromStore,
                            loading: false,
                            networkStatus: NetworkStatus.ready,
                            stale: false,
                        });
                    },
                });
                _this.setQuery(queryId, function (_a) {
                    var subscriptions = _a.subscriptions;
                    subscriptions.add(subscription);
                });
            });
        };
        QueryManager.prototype.getQuery = function (queryId) {
            return (this.queries.get(queryId) || {
                listeners: new Set(),
                invalidated: false,
                document: null,
                newData: null,
                lastRequestId: 1,
                observableQuery: null,
                subscriptions: new Set(),
            });
        };
        QueryManager.prototype.setQuery = function (queryId, updater) {
            var prev = this.getQuery(queryId);
            var newInfo = __assign({}, prev, updater(prev));
            this.queries.set(queryId, newInfo);
        };
        QueryManager.prototype.invalidate = function (queryId, invalidated) {
            if (invalidated === void 0) { invalidated = true; }
            if (queryId) {
                this.setQuery(queryId, function () { return ({ invalidated: invalidated }); });
            }
        };
        QueryManager.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var newContext = this.localState.prepareContext(context);
            return __assign({}, newContext, { clientAwareness: this.clientAwareness });
        };
        QueryManager.prototype.checkInFlight = function (queryId) {
            var query = this.queryStore.get(queryId);
            return (query &&
                query.networkStatus !== NetworkStatus.ready &&
                query.networkStatus !== NetworkStatus.error);
        };
        QueryManager.prototype.startPollingQuery = function (options, queryId, listener) {
            var _this = this;
            var pollInterval = options.pollInterval;
            process.env.NODE_ENV === "production" ? invariant(pollInterval, 18) : invariant(pollInterval, 'Attempted to start a polling query without a polling interval.');
            if (!this.ssrMode) {
                var info = this.pollingInfoByQueryId.get(queryId);
                if (!info) {
                    this.pollingInfoByQueryId.set(queryId, (info = {}));
                }
                info.interval = pollInterval;
                info.options = __assign({}, options, { fetchPolicy: 'network-only' });
                var maybeFetch_1 = function () {
                    var info = _this.pollingInfoByQueryId.get(queryId);
                    if (info) {
                        if (_this.checkInFlight(queryId)) {
                            poll_1();
                        }
                        else {
                            _this.fetchQuery(queryId, info.options, FetchType.poll).then(poll_1, poll_1);
                        }
                    }
                };
                var poll_1 = function () {
                    var info = _this.pollingInfoByQueryId.get(queryId);
                    if (info) {
                        clearTimeout(info.timeout);
                        info.timeout = setTimeout(maybeFetch_1, info.interval);
                    }
                };
                if (listener) {
                    this.addQueryListener(queryId, listener);
                }
                poll_1();
            }
            return queryId;
        };
        QueryManager.prototype.stopPollingQuery = function (queryId) {
            this.pollingInfoByQueryId.delete(queryId);
        };
        return QueryManager;
    }());

    var DataStore = (function () {
        function DataStore(initialCache) {
            this.cache = initialCache;
        }
        DataStore.prototype.getCache = function () {
            return this.cache;
        };
        DataStore.prototype.markQueryResult = function (result, document, variables, fetchMoreForQueryId, ignoreErrors) {
            if (ignoreErrors === void 0) { ignoreErrors = false; }
            var writeWithErrors = !graphQLResultHasError(result);
            if (ignoreErrors && graphQLResultHasError(result) && result.data) {
                writeWithErrors = true;
            }
            if (!fetchMoreForQueryId && writeWithErrors) {
                this.cache.write({
                    result: result.data,
                    dataId: 'ROOT_QUERY',
                    query: document,
                    variables: variables,
                });
            }
        };
        DataStore.prototype.markSubscriptionResult = function (result, document, variables) {
            if (!graphQLResultHasError(result)) {
                this.cache.write({
                    result: result.data,
                    dataId: 'ROOT_SUBSCRIPTION',
                    query: document,
                    variables: variables,
                });
            }
        };
        DataStore.prototype.markMutationInit = function (mutation) {
            var _this = this;
            if (mutation.optimisticResponse) {
                var optimistic_1;
                if (typeof mutation.optimisticResponse === 'function') {
                    optimistic_1 = mutation.optimisticResponse(mutation.variables);
                }
                else {
                    optimistic_1 = mutation.optimisticResponse;
                }
                this.cache.recordOptimisticTransaction(function (c) {
                    var orig = _this.cache;
                    _this.cache = c;
                    try {
                        _this.markMutationResult({
                            mutationId: mutation.mutationId,
                            result: { data: optimistic_1 },
                            document: mutation.document,
                            variables: mutation.variables,
                            updateQueries: mutation.updateQueries,
                            update: mutation.update,
                        });
                    }
                    finally {
                        _this.cache = orig;
                    }
                }, mutation.mutationId);
            }
        };
        DataStore.prototype.markMutationResult = function (mutation) {
            var _this = this;
            if (!graphQLResultHasError(mutation.result)) {
                var cacheWrites_1 = [{
                        result: mutation.result.data,
                        dataId: 'ROOT_MUTATION',
                        query: mutation.document,
                        variables: mutation.variables,
                    }];
                var updateQueries_1 = mutation.updateQueries;
                if (updateQueries_1) {
                    Object.keys(updateQueries_1).forEach(function (id) {
                        var _a = updateQueries_1[id], query = _a.query, updater = _a.updater;
                        var _b = _this.cache.diff({
                            query: query.document,
                            variables: query.variables,
                            returnPartialData: true,
                            optimistic: false,
                        }), currentQueryResult = _b.result, complete = _b.complete;
                        if (complete) {
                            var nextQueryResult = tryFunctionOrLogError(function () {
                                return updater(currentQueryResult, {
                                    mutationResult: mutation.result,
                                    queryName: getOperationName(query.document) || undefined,
                                    queryVariables: query.variables,
                                });
                            });
                            if (nextQueryResult) {
                                cacheWrites_1.push({
                                    result: nextQueryResult,
                                    dataId: 'ROOT_QUERY',
                                    query: query.document,
                                    variables: query.variables,
                                });
                            }
                        }
                    });
                }
                this.cache.performTransaction(function (c) {
                    cacheWrites_1.forEach(function (write) { return c.write(write); });
                    var update = mutation.update;
                    if (update) {
                        tryFunctionOrLogError(function () { return update(c, mutation.result); });
                    }
                });
            }
        };
        DataStore.prototype.markMutationComplete = function (_a) {
            var mutationId = _a.mutationId, optimisticResponse = _a.optimisticResponse;
            if (optimisticResponse) {
                this.cache.removeOptimistic(mutationId);
            }
        };
        DataStore.prototype.markUpdateQueryResult = function (document, variables, newResult) {
            this.cache.write({
                result: newResult,
                dataId: 'ROOT_QUERY',
                variables: variables,
                query: document,
            });
        };
        DataStore.prototype.reset = function () {
            return this.cache.reset();
        };
        return DataStore;
    }());

    var version = "2.6.4";

    var hasSuggestedDevtools = false;
    var ApolloClient = (function () {
        function ApolloClient(options) {
            var _this = this;
            this.defaultOptions = {};
            this.resetStoreCallbacks = [];
            this.clearStoreCallbacks = [];
            var cache = options.cache, _a = options.ssrMode, ssrMode = _a === void 0 ? false : _a, _b = options.ssrForceFetchDelay, ssrForceFetchDelay = _b === void 0 ? 0 : _b, connectToDevTools = options.connectToDevTools, _c = options.queryDeduplication, queryDeduplication = _c === void 0 ? true : _c, defaultOptions = options.defaultOptions, _d = options.assumeImmutableResults, assumeImmutableResults = _d === void 0 ? false : _d, resolvers = options.resolvers, typeDefs = options.typeDefs, fragmentMatcher = options.fragmentMatcher, clientAwarenessName = options.name, clientAwarenessVersion = options.version;
            var link = options.link;
            if (!link && resolvers) {
                link = ApolloLink.empty();
            }
            if (!link || !cache) {
                throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("In order to initialize Apollo Client, you must specify 'link' and 'cache' properties in the options object.\n" +
                    "These options are part of the upgrade requirements when migrating from Apollo Client 1.x to Apollo Client 2.x.\n" +
                    "For more information, please visit: https://www.apollographql.com/docs/tutorial/client.html#apollo-client-setup");
            }
            this.link = link;
            this.cache = cache;
            this.store = new DataStore(cache);
            this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
            this.queryDeduplication = queryDeduplication;
            this.defaultOptions = defaultOptions || {};
            this.typeDefs = typeDefs;
            if (ssrForceFetchDelay) {
                setTimeout(function () { return (_this.disableNetworkFetches = false); }, ssrForceFetchDelay);
            }
            this.watchQuery = this.watchQuery.bind(this);
            this.query = this.query.bind(this);
            this.mutate = this.mutate.bind(this);
            this.resetStore = this.resetStore.bind(this);
            this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
            var defaultConnectToDevTools = process.env.NODE_ENV !== 'production' &&
                typeof window !== 'undefined' &&
                !window.__APOLLO_CLIENT__;
            if (typeof connectToDevTools === 'undefined'
                ? defaultConnectToDevTools
                : connectToDevTools && typeof window !== 'undefined') {
                window.__APOLLO_CLIENT__ = this;
            }
            if (!hasSuggestedDevtools && process.env.NODE_ENV !== 'production') {
                hasSuggestedDevtools = true;
                if (typeof window !== 'undefined' &&
                    window.document &&
                    window.top === window.self) {
                    if (typeof window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
                        if (window.navigator &&
                            window.navigator.userAgent &&
                            window.navigator.userAgent.indexOf('Chrome') > -1) {
                            console.debug('Download the Apollo DevTools ' +
                                'for a better development experience: ' +
                                'https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm');
                        }
                    }
                }
            }
            this.version = version;
            this.localState = new LocalState({
                cache: cache,
                client: this,
                resolvers: resolvers,
                fragmentMatcher: fragmentMatcher,
            });
            this.queryManager = new QueryManager({
                link: this.link,
                store: this.store,
                queryDeduplication: queryDeduplication,
                ssrMode: ssrMode,
                clientAwareness: {
                    name: clientAwarenessName,
                    version: clientAwarenessVersion,
                },
                localState: this.localState,
                assumeImmutableResults: assumeImmutableResults,
                onBroadcast: function () {
                    if (_this.devToolsHookCb) {
                        _this.devToolsHookCb({
                            action: {},
                            state: {
                                queries: _this.queryManager.queryStore.getStore(),
                                mutations: _this.queryManager.mutationStore.getStore(),
                            },
                            dataWithOptimisticResults: _this.cache.extract(true),
                        });
                    }
                },
            });
        }
        ApolloClient.prototype.stop = function () {
            this.queryManager.stop();
        };
        ApolloClient.prototype.watchQuery = function (options) {
            if (this.defaultOptions.watchQuery) {
                options = __assign({}, this.defaultOptions.watchQuery, options);
            }
            if (this.disableNetworkFetches &&
                (options.fetchPolicy === 'network-only' ||
                    options.fetchPolicy === 'cache-and-network')) {
                options = __assign({}, options, { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.watchQuery(options);
        };
        ApolloClient.prototype.query = function (options) {
            if (this.defaultOptions.query) {
                options = __assign({}, this.defaultOptions.query, options);
            }
            process.env.NODE_ENV === "production" ? invariant(options.fetchPolicy !== 'cache-and-network', 2) : invariant(options.fetchPolicy !== 'cache-and-network', 'The cache-and-network fetchPolicy does not work with client.query, because ' +
                'client.query can only return a single result. Please use client.watchQuery ' +
                'to receive multiple results from the cache and the network, or consider ' +
                'using a different fetchPolicy, such as cache-first or network-only.');
            if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
                options = __assign({}, options, { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.query(options);
        };
        ApolloClient.prototype.mutate = function (options) {
            if (this.defaultOptions.mutate) {
                options = __assign({}, this.defaultOptions.mutate, options);
            }
            return this.queryManager.mutate(options);
        };
        ApolloClient.prototype.subscribe = function (options) {
            return this.queryManager.startGraphQLSubscription(options);
        };
        ApolloClient.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readQuery(options, optimistic);
        };
        ApolloClient.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readFragment(options, optimistic);
        };
        ApolloClient.prototype.writeQuery = function (options) {
            var result = this.cache.writeQuery(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.writeFragment = function (options) {
            var result = this.cache.writeFragment(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.writeData = function (options) {
            var result = this.cache.writeData(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.__actionHookForDevTools = function (cb) {
            this.devToolsHookCb = cb;
        };
        ApolloClient.prototype.__requestRaw = function (payload) {
            return execute(this.link, payload);
        };
        ApolloClient.prototype.initQueryManager = function () {
            process.env.NODE_ENV === "production" || invariant.warn('Calling the initQueryManager method is no longer necessary, ' +
                'and it will be removed from ApolloClient in version 3.0.');
            return this.queryManager;
        };
        ApolloClient.prototype.resetStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.resetStoreCallbacks.map(function (fn) { return fn(); })); })
                .then(function () { return _this.reFetchObservableQueries(); });
        };
        ApolloClient.prototype.clearStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.clearStoreCallbacks.map(function (fn) { return fn(); })); });
        };
        ApolloClient.prototype.onResetStore = function (cb) {
            var _this = this;
            this.resetStoreCallbacks.push(cb);
            return function () {
                _this.resetStoreCallbacks = _this.resetStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.onClearStore = function (cb) {
            var _this = this;
            this.clearStoreCallbacks.push(cb);
            return function () {
                _this.clearStoreCallbacks = _this.clearStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.reFetchObservableQueries = function (includeStandby) {
            return this.queryManager.reFetchObservableQueries(includeStandby);
        };
        ApolloClient.prototype.extract = function (optimistic) {
            return this.cache.extract(optimistic);
        };
        ApolloClient.prototype.restore = function (serializedState) {
            return this.cache.restore(serializedState);
        };
        ApolloClient.prototype.addResolvers = function (resolvers) {
            this.localState.addResolvers(resolvers);
        };
        ApolloClient.prototype.setResolvers = function (resolvers) {
            this.localState.setResolvers(resolvers);
        };
        ApolloClient.prototype.getResolvers = function () {
            return this.localState.getResolvers();
        };
        ApolloClient.prototype.setLocalStateFragmentMatcher = function (fragmentMatcher) {
            this.localState.setFragmentMatcher(fragmentMatcher);
        };
        return ApolloClient;
    }());
    //# sourceMappingURL=bundle.esm.js.map

    function queryFromPojo(obj) {
        var op = {
            kind: 'OperationDefinition',
            operation: 'query',
            name: {
                kind: 'Name',
                value: 'GeneratedClientQuery',
            },
            selectionSet: selectionSetFromObj(obj),
        };
        var out = {
            kind: 'Document',
            definitions: [op],
        };
        return out;
    }
    function fragmentFromPojo(obj, typename) {
        var frag = {
            kind: 'FragmentDefinition',
            typeCondition: {
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: typename || '__FakeType',
                },
            },
            name: {
                kind: 'Name',
                value: 'GeneratedClientQuery',
            },
            selectionSet: selectionSetFromObj(obj),
        };
        var out = {
            kind: 'Document',
            definitions: [frag],
        };
        return out;
    }
    function selectionSetFromObj(obj) {
        if (typeof obj === 'number' ||
            typeof obj === 'boolean' ||
            typeof obj === 'string' ||
            typeof obj === 'undefined' ||
            obj === null) {
            return null;
        }
        if (Array.isArray(obj)) {
            return selectionSetFromObj(obj[0]);
        }
        var selections = [];
        Object.keys(obj).forEach(function (key) {
            var nestedSelSet = selectionSetFromObj(obj[key]);
            var field = {
                kind: 'Field',
                name: {
                    kind: 'Name',
                    value: key,
                },
                selectionSet: nestedSelSet || undefined,
            };
            selections.push(field);
        });
        var selectionSet = {
            kind: 'SelectionSet',
            selections: selections,
        };
        return selectionSet;
    }
    var justTypenameQuery = {
        kind: 'Document',
        definitions: [
            {
                kind: 'OperationDefinition',
                operation: 'query',
                name: null,
                variableDefinitions: null,
                directives: [],
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                        {
                            kind: 'Field',
                            alias: null,
                            name: {
                                kind: 'Name',
                                value: '__typename',
                            },
                            arguments: [],
                            directives: [],
                            selectionSet: null,
                        },
                    ],
                },
            },
        ],
    };

    var ApolloCache = (function () {
        function ApolloCache() {
        }
        ApolloCache.prototype.transformDocument = function (document) {
            return document;
        };
        ApolloCache.prototype.transformForLink = function (document) {
            return document;
        };
        ApolloCache.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.read({
                query: options.query,
                variables: options.variables,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.read({
                query: getFragmentQueryDocument(options.fragment, options.fragmentName),
                variables: options.variables,
                rootId: options.id,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.writeQuery = function (options) {
            this.write({
                dataId: 'ROOT_QUERY',
                result: options.data,
                query: options.query,
                variables: options.variables,
            });
        };
        ApolloCache.prototype.writeFragment = function (options) {
            this.write({
                dataId: options.id,
                result: options.data,
                variables: options.variables,
                query: getFragmentQueryDocument(options.fragment, options.fragmentName),
            });
        };
        ApolloCache.prototype.writeData = function (_a) {
            var id = _a.id, data = _a.data;
            if (typeof id !== 'undefined') {
                var typenameResult = null;
                try {
                    typenameResult = this.read({
                        rootId: id,
                        optimistic: false,
                        query: justTypenameQuery,
                    });
                }
                catch (e) {
                }
                var __typename = (typenameResult && typenameResult.__typename) || '__ClientData';
                var dataToWrite = Object.assign({ __typename: __typename }, data);
                this.writeFragment({
                    id: id,
                    fragment: fragmentFromPojo(dataToWrite, __typename),
                    data: dataToWrite,
                });
            }
            else {
                this.writeQuery({ query: queryFromPojo(data), data: data });
            }
        };
        return ApolloCache;
    }());
    //# sourceMappingURL=bundle.esm.js.map

    // This currentContext variable will only be used if the makeSlotClass
    // function is called, which happens only if this is the first copy of the
    // @wry/context package to be imported.
    var currentContext = null;
    // This unique internal object is used to denote the absence of a value
    // for a given Slot, and is never exposed to outside code.
    var MISSING_VALUE = {};
    var idCounter = 1;
    // Although we can't do anything about the cost of duplicated code from
    // accidentally bundling multiple copies of the @wry/context package, we can
    // avoid creating the Slot class more than once using makeSlotClass.
    var makeSlotClass = function () { return /** @class */ (function () {
        function Slot() {
            // If you have a Slot object, you can find out its slot.id, but you cannot
            // guess the slot.id of a Slot you don't have access to, thanks to the
            // randomized suffix.
            this.id = [
                "slot",
                idCounter++,
                Date.now(),
                Math.random().toString(36).slice(2),
            ].join(":");
        }
        Slot.prototype.hasValue = function () {
            for (var context_1 = currentContext; context_1; context_1 = context_1.parent) {
                // We use the Slot object iself as a key to its value, which means the
                // value cannot be obtained without a reference to the Slot object.
                if (this.id in context_1.slots) {
                    var value = context_1.slots[this.id];
                    if (value === MISSING_VALUE)
                        break;
                    if (context_1 !== currentContext) {
                        // Cache the value in currentContext.slots so the next lookup will
                        // be faster. This caching is safe because the tree of contexts and
                        // the values of the slots are logically immutable.
                        currentContext.slots[this.id] = value;
                    }
                    return true;
                }
            }
            if (currentContext) {
                // If a value was not found for this Slot, it's never going to be found
                // no matter how many times we look it up, so we might as well cache
                // the absence of the value, too.
                currentContext.slots[this.id] = MISSING_VALUE;
            }
            return false;
        };
        Slot.prototype.getValue = function () {
            if (this.hasValue()) {
                return currentContext.slots[this.id];
            }
        };
        Slot.prototype.withValue = function (value, callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            var _a;
            var slots = (_a = {
                    __proto__: null
                },
                _a[this.id] = value,
                _a);
            var parent = currentContext;
            currentContext = { parent: parent, slots: slots };
            try {
                // Function.prototype.apply allows the arguments array argument to be
                // omitted or undefined, so args! is fine here.
                return callback.apply(thisArg, args);
            }
            finally {
                currentContext = parent;
            }
        };
        // Capture the current context and wrap a callback function so that it
        // reestablishes the captured context when called.
        Slot.bind = function (callback) {
            var context = currentContext;
            return function () {
                var saved = currentContext;
                try {
                    currentContext = context;
                    return callback.apply(this, arguments);
                }
                finally {
                    currentContext = saved;
                }
            };
        };
        // Immediately run a callback function without any captured context.
        Slot.noContext = function (callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            if (currentContext) {
                var saved = currentContext;
                try {
                    currentContext = null;
                    // Function.prototype.apply allows the arguments array argument to be
                    // omitted or undefined, so args! is fine here.
                    return callback.apply(thisArg, args);
                }
                finally {
                    currentContext = saved;
                }
            }
            else {
                return callback.apply(thisArg, args);
            }
        };
        return Slot;
    }()); };
    // We store a single global implementation of the Slot class as a permanent
    // non-enumerable symbol property of the Array constructor. This obfuscation
    // does nothing to prevent access to the Slot class, but at least it ensures
    // the implementation (i.e. currentContext) cannot be tampered with, and all
    // copies of the @wry/context package (hopefully just one) will share the
    // same Slot implementation. Since the first copy of the @wry/context package
    // to be imported wins, this technique imposes a very high cost for any
    // future breaking changes to the Slot class.
    var globalKey = "@wry/context:Slot";
    var host = Array;
    var Slot = host[globalKey] || function () {
        var Slot = makeSlotClass();
        try {
            Object.defineProperty(host, globalKey, {
                value: host[globalKey] = Slot,
                enumerable: false,
                writable: false,
                configurable: false,
            });
        }
        finally {
            return Slot;
        }
    }();

    var bind$1 = Slot.bind, noContext = Slot.noContext;
    //# sourceMappingURL=context.esm.js.map

    function defaultDispose() { }
    var Cache = /** @class */ (function () {
        function Cache(max, dispose) {
            if (max === void 0) { max = Infinity; }
            if (dispose === void 0) { dispose = defaultDispose; }
            this.max = max;
            this.dispose = dispose;
            this.map = new Map();
            this.newest = null;
            this.oldest = null;
        }
        Cache.prototype.has = function (key) {
            return this.map.has(key);
        };
        Cache.prototype.get = function (key) {
            var entry = this.getEntry(key);
            return entry && entry.value;
        };
        Cache.prototype.getEntry = function (key) {
            var entry = this.map.get(key);
            if (entry && entry !== this.newest) {
                var older = entry.older, newer = entry.newer;
                if (newer) {
                    newer.older = older;
                }
                if (older) {
                    older.newer = newer;
                }
                entry.older = this.newest;
                entry.older.newer = entry;
                entry.newer = null;
                this.newest = entry;
                if (entry === this.oldest) {
                    this.oldest = newer;
                }
            }
            return entry;
        };
        Cache.prototype.set = function (key, value) {
            var entry = this.getEntry(key);
            if (entry) {
                return entry.value = value;
            }
            entry = {
                key: key,
                value: value,
                newer: null,
                older: this.newest
            };
            if (this.newest) {
                this.newest.newer = entry;
            }
            this.newest = entry;
            this.oldest = this.oldest || entry;
            this.map.set(key, entry);
            return entry.value;
        };
        Cache.prototype.clean = function () {
            while (this.oldest && this.map.size > this.max) {
                this.delete(this.oldest.key);
            }
        };
        Cache.prototype.delete = function (key) {
            var entry = this.map.get(key);
            if (entry) {
                if (entry === this.newest) {
                    this.newest = entry.older;
                }
                if (entry === this.oldest) {
                    this.oldest = entry.newer;
                }
                if (entry.newer) {
                    entry.newer.older = entry.older;
                }
                if (entry.older) {
                    entry.older.newer = entry.newer;
                }
                this.map.delete(key);
                this.dispose(entry.value, key);
                return true;
            }
            return false;
        };
        return Cache;
    }());

    var parentEntrySlot = new Slot();

    var reusableEmptyArray = [];
    var emptySetPool = [];
    var POOL_TARGET_SIZE = 100;
    // Since this package might be used browsers, we should avoid using the
    // Node built-in assert module.
    function assert(condition, optionalMessage) {
        if (!condition) {
            throw new Error(optionalMessage || "assertion failure");
        }
    }
    function valueIs(a, b) {
        var len = a.length;
        return (
        // Unknown values are not equal to each other.
        len > 0 &&
            // Both values must be ordinary (or both exceptional) to be equal.
            len === b.length &&
            // The underlying value or exception must be the same.
            a[len - 1] === b[len - 1]);
    }
    function valueGet(value) {
        switch (value.length) {
            case 0: throw new Error("unknown value");
            case 1: return value[0];
            case 2: throw value[1];
        }
    }
    function valueCopy(value) {
        return value.slice(0);
    }
    var Entry = /** @class */ (function () {
        function Entry(fn, args) {
            this.fn = fn;
            this.args = args;
            this.parents = new Set();
            this.childValues = new Map();
            // When this Entry has children that are dirty, this property becomes
            // a Set containing other Entry objects, borrowed from emptySetPool.
            // When the set becomes empty, it gets recycled back to emptySetPool.
            this.dirtyChildren = null;
            this.dirty = true;
            this.recomputing = false;
            this.value = [];
            ++Entry.count;
        }
        // This is the most important method of the Entry API, because it
        // determines whether the cached this.value can be returned immediately,
        // or must be recomputed. The overall performance of the caching system
        // depends on the truth of the following observations: (1) this.dirty is
        // usually false, (2) this.dirtyChildren is usually null/empty, and thus
        // (3) valueGet(this.value) is usually returned without recomputation.
        Entry.prototype.recompute = function () {
            assert(!this.recomputing, "already recomputing");
            if (!rememberParent(this) && maybeReportOrphan(this)) {
                // The recipient of the entry.reportOrphan callback decided to dispose
                // of this orphan entry by calling entry.dispose(), so we don't need to
                // (and should not) proceed with the recomputation.
                return void 0;
            }
            return mightBeDirty(this)
                ? reallyRecompute(this)
                : valueGet(this.value);
        };
        Entry.prototype.setDirty = function () {
            if (this.dirty)
                return;
            this.dirty = true;
            this.value.length = 0;
            reportDirty(this);
            // We can go ahead and unsubscribe here, since any further dirty
            // notifications we receive will be redundant, and unsubscribing may
            // free up some resources, e.g. file watchers.
            maybeUnsubscribe(this);
        };
        Entry.prototype.dispose = function () {
            var _this = this;
            forgetChildren(this).forEach(maybeReportOrphan);
            maybeUnsubscribe(this);
            // Because this entry has been kicked out of the cache (in index.js),
            // we've lost the ability to find out if/when this entry becomes dirty,
            // whether that happens through a subscription, because of a direct call
            // to entry.setDirty(), or because one of its children becomes dirty.
            // Because of this loss of future information, we have to assume the
            // worst (that this entry might have become dirty very soon), so we must
            // immediately mark this entry's parents as dirty. Normally we could
            // just call entry.setDirty() rather than calling parent.setDirty() for
            // each parent, but that would leave this entry in parent.childValues
            // and parent.dirtyChildren, which would prevent the child from being
            // truly forgotten.
            this.parents.forEach(function (parent) {
                parent.setDirty();
                forgetChild(parent, _this);
            });
        };
        Entry.count = 0;
        return Entry;
    }());
    function rememberParent(child) {
        var parent = parentEntrySlot.getValue();
        if (parent) {
            child.parents.add(parent);
            if (!parent.childValues.has(child)) {
                parent.childValues.set(child, []);
            }
            if (mightBeDirty(child)) {
                reportDirtyChild(parent, child);
            }
            else {
                reportCleanChild(parent, child);
            }
            return parent;
        }
    }
    function reallyRecompute(entry) {
        // Since this recomputation is likely to re-remember some of this
        // entry's children, we forget our children here but do not call
        // maybeReportOrphan until after the recomputation finishes.
        var originalChildren = forgetChildren(entry);
        // Set entry as the parent entry while calling recomputeNewValue(entry).
        parentEntrySlot.withValue(entry, recomputeNewValue, [entry]);
        if (maybeSubscribe(entry)) {
            // If we successfully recomputed entry.value and did not fail to
            // (re)subscribe, then this Entry is no longer explicitly dirty.
            setClean(entry);
        }
        // Now that we've had a chance to re-remember any children that were
        // involved in the recomputation, we can safely report any orphan
        // children that remain.
        originalChildren.forEach(maybeReportOrphan);
        return valueGet(entry.value);
    }
    function recomputeNewValue(entry) {
        entry.recomputing = true;
        // Set entry.value as unknown.
        entry.value.length = 0;
        try {
            // If entry.fn succeeds, entry.value will become a normal Value.
            entry.value[0] = entry.fn.apply(null, entry.args);
        }
        catch (e) {
            // If entry.fn throws, entry.value will become exceptional.
            entry.value[1] = e;
        }
        // Either way, this line is always reached.
        entry.recomputing = false;
    }
    function mightBeDirty(entry) {
        return entry.dirty || !!(entry.dirtyChildren && entry.dirtyChildren.size);
    }
    function setClean(entry) {
        entry.dirty = false;
        if (mightBeDirty(entry)) {
            // This Entry may still have dirty children, in which case we can't
            // let our parents know we're clean just yet.
            return;
        }
        reportClean(entry);
    }
    function reportDirty(child) {
        child.parents.forEach(function (parent) { return reportDirtyChild(parent, child); });
    }
    function reportClean(child) {
        child.parents.forEach(function (parent) { return reportCleanChild(parent, child); });
    }
    // Let a parent Entry know that one of its children may be dirty.
    function reportDirtyChild(parent, child) {
        // Must have called rememberParent(child) before calling
        // reportDirtyChild(parent, child).
        assert(parent.childValues.has(child));
        assert(mightBeDirty(child));
        if (!parent.dirtyChildren) {
            parent.dirtyChildren = emptySetPool.pop() || new Set;
        }
        else if (parent.dirtyChildren.has(child)) {
            // If we already know this child is dirty, then we must have already
            // informed our own parents that we are dirty, so we can terminate
            // the recursion early.
            return;
        }
        parent.dirtyChildren.add(child);
        reportDirty(parent);
    }
    // Let a parent Entry know that one of its children is no longer dirty.
    function reportCleanChild(parent, child) {
        // Must have called rememberChild(child) before calling
        // reportCleanChild(parent, child).
        assert(parent.childValues.has(child));
        assert(!mightBeDirty(child));
        var childValue = parent.childValues.get(child);
        if (childValue.length === 0) {
            parent.childValues.set(child, valueCopy(child.value));
        }
        else if (!valueIs(childValue, child.value)) {
            parent.setDirty();
        }
        removeDirtyChild(parent, child);
        if (mightBeDirty(parent)) {
            return;
        }
        reportClean(parent);
    }
    function removeDirtyChild(parent, child) {
        var dc = parent.dirtyChildren;
        if (dc) {
            dc.delete(child);
            if (dc.size === 0) {
                if (emptySetPool.length < POOL_TARGET_SIZE) {
                    emptySetPool.push(dc);
                }
                parent.dirtyChildren = null;
            }
        }
    }
    // If the given entry has a reportOrphan method, and no remaining parents,
    // call entry.reportOrphan and return true iff it returns true. The
    // reportOrphan function should return true to indicate entry.dispose()
    // has been called, and the entry has been removed from any other caches
    // (see index.js for the only current example).
    function maybeReportOrphan(entry) {
        return entry.parents.size === 0 &&
            typeof entry.reportOrphan === "function" &&
            entry.reportOrphan() === true;
    }
    // Removes all children from this entry and returns an array of the
    // removed children.
    function forgetChildren(parent) {
        var children = reusableEmptyArray;
        if (parent.childValues.size > 0) {
            children = [];
            parent.childValues.forEach(function (_value, child) {
                forgetChild(parent, child);
                children.push(child);
            });
        }
        // After we forget all our children, this.dirtyChildren must be empty
        // and therefore must have been reset to null.
        assert(parent.dirtyChildren === null);
        return children;
    }
    function forgetChild(parent, child) {
        child.parents.delete(parent);
        parent.childValues.delete(child);
        removeDirtyChild(parent, child);
    }
    function maybeSubscribe(entry) {
        if (typeof entry.subscribe === "function") {
            try {
                maybeUnsubscribe(entry); // Prevent double subscriptions.
                entry.unsubscribe = entry.subscribe.apply(null, entry.args);
            }
            catch (e) {
                // If this Entry has a subscribe function and it threw an exception
                // (or an unsubscribe function it previously returned now throws),
                // return false to indicate that we were not able to subscribe (or
                // unsubscribe), and this Entry should remain dirty.
                entry.setDirty();
                return false;
            }
        }
        // Returning true indicates either that there was no entry.subscribe
        // function or that it succeeded.
        return true;
    }
    function maybeUnsubscribe(entry) {
        var unsubscribe = entry.unsubscribe;
        if (typeof unsubscribe === "function") {
            entry.unsubscribe = void 0;
            unsubscribe();
        }
    }

    // A trie data structure that holds object keys weakly, yet can also hold
    // non-object keys, unlike the native `WeakMap`.
    var KeyTrie = /** @class */ (function () {
        function KeyTrie(weakness) {
            this.weakness = weakness;
        }
        KeyTrie.prototype.lookup = function () {
            var array = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                array[_i] = arguments[_i];
            }
            return this.lookupArray(array);
        };
        KeyTrie.prototype.lookupArray = function (array) {
            var node = this;
            array.forEach(function (key) { return node = node.getChildTrie(key); });
            return node.data || (node.data = Object.create(null));
        };
        KeyTrie.prototype.getChildTrie = function (key) {
            var map = this.weakness && isObjRef(key)
                ? this.weak || (this.weak = new WeakMap())
                : this.strong || (this.strong = new Map());
            var child = map.get(key);
            if (!child)
                map.set(key, child = new KeyTrie(this.weakness));
            return child;
        };
        return KeyTrie;
    }());
    function isObjRef(value) {
        switch (typeof value) {
            case "object":
                if (value === null)
                    break;
            // Fall through to return true...
            case "function":
                return true;
        }
        return false;
    }

    // The defaultMakeCacheKey function is remarkably powerful, because it gives
    // a unique object for any shallow-identical list of arguments. If you need
    // to implement a custom makeCacheKey function, you may find it helpful to
    // delegate the final work to defaultMakeCacheKey, which is why we export it
    // here. However, you may want to avoid defaultMakeCacheKey if your runtime
    // does not support WeakMap, or you have the ability to return a string key.
    // In those cases, just write your own custom makeCacheKey functions.
    var keyTrie = new KeyTrie(typeof WeakMap === "function");
    function defaultMakeCacheKey() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return keyTrie.lookupArray(args);
    }
    var caches = new Set();
    function wrap(originalFunction, options) {
        if (options === void 0) { options = Object.create(null); }
        var cache = new Cache(options.max || Math.pow(2, 16), function (entry) { return entry.dispose(); });
        var disposable = !!options.disposable;
        var makeCacheKey = options.makeCacheKey || defaultMakeCacheKey;
        function optimistic() {
            if (disposable && !parentEntrySlot.hasValue()) {
                // If there's no current parent computation, and this wrapped
                // function is disposable (meaning we don't care about entry.value,
                // just dependency tracking), then we can short-cut everything else
                // in this function, because entry.recompute() is going to recycle
                // the entry object without recomputing anything, anyway.
                return void 0;
            }
            var key = makeCacheKey.apply(null, arguments);
            if (!key) {
                return originalFunction.apply(null, arguments);
            }
            var args = Array.prototype.slice.call(arguments);
            var entry = cache.get(key);
            if (entry) {
                entry.args = args;
            }
            else {
                entry = new Entry(originalFunction, args);
                cache.set(key, entry);
                entry.subscribe = options.subscribe;
                if (disposable) {
                    entry.reportOrphan = function () { return cache.delete(key); };
                }
            }
            var value = entry.recompute();
            // Move this entry to the front of the least-recently used queue,
            // since we just finished computing its value.
            cache.set(key, entry);
            caches.add(cache);
            // Clean up any excess entries in the cache, but only if there is no
            // active parent entry, meaning we're not in the middle of a larger
            // computation that might be flummoxed by the cleaning.
            if (!parentEntrySlot.hasValue()) {
                caches.forEach(function (cache) { return cache.clean(); });
                caches.clear();
            }
            // If options.disposable is truthy, the caller of wrap is telling us
            // they don't care about the result of entry.recompute(), so we should
            // avoid returning the value, so it won't be accidentally used.
            return disposable ? void 0 : value;
        }
        optimistic.dirty = function () {
            var key = makeCacheKey.apply(null, arguments);
            var child = key && cache.get(key);
            if (child) {
                child.setDirty();
            }
        };
        return optimistic;
    }
    //# sourceMappingURL=bundle.esm.js.map

    var haveWarned = false;
    function shouldWarn() {
        var answer = !haveWarned;
        if (!isTest()) {
            haveWarned = true;
        }
        return answer;
    }
    var HeuristicFragmentMatcher = (function () {
        function HeuristicFragmentMatcher() {
        }
        HeuristicFragmentMatcher.prototype.ensureReady = function () {
            return Promise.resolve();
        };
        HeuristicFragmentMatcher.prototype.canBypassInit = function () {
            return true;
        };
        HeuristicFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
            var obj = context.store.get(idValue.id);
            var isRootQuery = idValue.id === 'ROOT_QUERY';
            if (!obj) {
                return isRootQuery;
            }
            var _a = obj.__typename, __typename = _a === void 0 ? isRootQuery && 'Query' : _a;
            if (!__typename) {
                if (shouldWarn()) {
                    process.env.NODE_ENV === "production" || invariant.warn("You're using fragments in your queries, but either don't have the addTypename:\n  true option set in Apollo Client, or you are trying to write a fragment to the store without the __typename.\n   Please turn on the addTypename option and include __typename when writing fragments so that Apollo Client\n   can accurately match fragments.");
                    process.env.NODE_ENV === "production" || invariant.warn('Could not find __typename on Fragment ', typeCondition, obj);
                    process.env.NODE_ENV === "production" || invariant.warn("DEPRECATION WARNING: using fragments without __typename is unsupported behavior " +
                        "and will be removed in future versions of Apollo client. You should fix this and set addTypename to true now.");
                }
                return 'heuristic';
            }
            if (__typename === typeCondition) {
                return true;
            }
            if (shouldWarn()) {
                process.env.NODE_ENV === "production" || invariant.error('You are using the simple (heuristic) fragment matcher, but your ' +
                    'queries contain union or interface types. Apollo Client will not be ' +
                    'able to accurately map fragments. To make this error go away, use ' +
                    'the `IntrospectionFragmentMatcher` as described in the docs: ' +
                    'https://www.apollographql.com/docs/react/advanced/fragments.html#fragment-matcher');
            }
            return 'heuristic';
        };
        return HeuristicFragmentMatcher;
    }());

    var hasOwn = Object.prototype.hasOwnProperty;
    var DepTrackingCache = (function () {
        function DepTrackingCache(data) {
            var _this = this;
            if (data === void 0) { data = Object.create(null); }
            this.data = data;
            this.depend = wrap(function (dataId) { return _this.data[dataId]; }, {
                disposable: true,
                makeCacheKey: function (dataId) {
                    return dataId;
                },
            });
        }
        DepTrackingCache.prototype.toObject = function () {
            return this.data;
        };
        DepTrackingCache.prototype.get = function (dataId) {
            this.depend(dataId);
            return this.data[dataId];
        };
        DepTrackingCache.prototype.set = function (dataId, value) {
            var oldValue = this.data[dataId];
            if (value !== oldValue) {
                this.data[dataId] = value;
                this.depend.dirty(dataId);
            }
        };
        DepTrackingCache.prototype.delete = function (dataId) {
            if (hasOwn.call(this.data, dataId)) {
                delete this.data[dataId];
                this.depend.dirty(dataId);
            }
        };
        DepTrackingCache.prototype.clear = function () {
            this.replace(null);
        };
        DepTrackingCache.prototype.replace = function (newData) {
            var _this = this;
            if (newData) {
                Object.keys(newData).forEach(function (dataId) {
                    _this.set(dataId, newData[dataId]);
                });
                Object.keys(this.data).forEach(function (dataId) {
                    if (!hasOwn.call(newData, dataId)) {
                        _this.delete(dataId);
                    }
                });
            }
            else {
                Object.keys(this.data).forEach(function (dataId) {
                    _this.delete(dataId);
                });
            }
        };
        return DepTrackingCache;
    }());
    function defaultNormalizedCacheFactory(seed) {
        return new DepTrackingCache(seed);
    }

    var StoreReader = (function () {
        function StoreReader(_a) {
            var _this = this;
            var _b = _a === void 0 ? {} : _a, _c = _b.cacheKeyRoot, cacheKeyRoot = _c === void 0 ? new KeyTrie(canUseWeakMap) : _c, _d = _b.freezeResults, freezeResults = _d === void 0 ? false : _d;
            var _e = this, executeStoreQuery = _e.executeStoreQuery, executeSelectionSet = _e.executeSelectionSet, executeSubSelectedArray = _e.executeSubSelectedArray;
            this.freezeResults = freezeResults;
            this.executeStoreQuery = wrap(function (options) {
                return executeStoreQuery.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, fragmentMatcher = _a.fragmentMatcher;
                    if (contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(contextValue.store, query, fragmentMatcher, JSON.stringify(variableValues), rootValue.id);
                    }
                }
            });
            this.executeSelectionSet = wrap(function (options) {
                return executeSelectionSet.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
                    if (execContext.contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(execContext.contextValue.store, selectionSet, execContext.fragmentMatcher, JSON.stringify(execContext.variableValues), rootValue.id);
                    }
                }
            });
            this.executeSubSelectedArray = wrap(function (options) {
                return executeSubSelectedArray.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var field = _a.field, array = _a.array, execContext = _a.execContext;
                    if (execContext.contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(execContext.contextValue.store, field, array, JSON.stringify(execContext.variableValues));
                    }
                }
            });
        }
        StoreReader.prototype.readQueryFromStore = function (options) {
            return this.diffQueryAgainstStore(__assign({}, options, { returnPartialData: false })).result;
        };
        StoreReader.prototype.diffQueryAgainstStore = function (_a) {
            var store = _a.store, query = _a.query, variables = _a.variables, previousResult = _a.previousResult, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? true : _b, _c = _a.rootId, rootId = _c === void 0 ? 'ROOT_QUERY' : _c, fragmentMatcherFunction = _a.fragmentMatcherFunction, config = _a.config;
            var queryDefinition = getQueryDefinition(query);
            variables = assign$1({}, getDefaultValues(queryDefinition), variables);
            var context = {
                store: store,
                dataIdFromObject: config && config.dataIdFromObject,
                cacheRedirects: (config && config.cacheRedirects) || {},
            };
            var execResult = this.executeStoreQuery({
                query: query,
                rootValue: {
                    type: 'id',
                    id: rootId,
                    generated: true,
                    typename: 'Query',
                },
                contextValue: context,
                variableValues: variables,
                fragmentMatcher: fragmentMatcherFunction,
            });
            var hasMissingFields = execResult.missing && execResult.missing.length > 0;
            if (hasMissingFields && !returnPartialData) {
                execResult.missing.forEach(function (info) {
                    if (info.tolerable)
                        return;
                    throw process.env.NODE_ENV === "production" ? new InvariantError(8) : new InvariantError("Can't find field " + info.fieldName + " on object " + JSON.stringify(info.object, null, 2) + ".");
                });
            }
            if (previousResult) {
                if (equal(previousResult, execResult.result)) {
                    execResult.result = previousResult;
                }
            }
            return {
                result: execResult.result,
                complete: !hasMissingFields,
            };
        };
        StoreReader.prototype.executeStoreQuery = function (_a) {
            var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, _b = _a.fragmentMatcher, fragmentMatcher = _b === void 0 ? defaultFragmentMatcher : _b;
            var mainDefinition = getMainDefinition(query);
            var fragments = getFragmentDefinitions(query);
            var fragmentMap = createFragmentMap(fragments);
            var execContext = {
                query: query,
                fragmentMap: fragmentMap,
                contextValue: contextValue,
                variableValues: variableValues,
                fragmentMatcher: fragmentMatcher,
            };
            return this.executeSelectionSet({
                selectionSet: mainDefinition.selectionSet,
                rootValue: rootValue,
                execContext: execContext,
            });
        };
        StoreReader.prototype.executeSelectionSet = function (_a) {
            var _this = this;
            var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
            var fragmentMap = execContext.fragmentMap, contextValue = execContext.contextValue, variables = execContext.variableValues;
            var finalResult = { result: null };
            var objectsToMerge = [];
            var object = contextValue.store.get(rootValue.id);
            var typename = (object && object.__typename) ||
                (rootValue.id === 'ROOT_QUERY' && 'Query') ||
                void 0;
            function handleMissing(result) {
                var _a;
                if (result.missing) {
                    finalResult.missing = finalResult.missing || [];
                    (_a = finalResult.missing).push.apply(_a, result.missing);
                }
                return result.result;
            }
            selectionSet.selections.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables)) {
                    return;
                }
                if (isField(selection)) {
                    var fieldResult = handleMissing(_this.executeField(object, typename, selection, execContext));
                    if (typeof fieldResult !== 'undefined') {
                        objectsToMerge.push((_a = {},
                            _a[resultKeyNameFromField(selection)] = fieldResult,
                            _a));
                    }
                }
                else {
                    var fragment = void 0;
                    if (isInlineFragment(selection)) {
                        fragment = selection;
                    }
                    else {
                        fragment = fragmentMap[selection.name.value];
                        if (!fragment) {
                            throw process.env.NODE_ENV === "production" ? new InvariantError(9) : new InvariantError("No fragment named " + selection.name.value);
                        }
                    }
                    var typeCondition = fragment.typeCondition && fragment.typeCondition.name.value;
                    var match = !typeCondition ||
                        execContext.fragmentMatcher(rootValue, typeCondition, contextValue);
                    if (match) {
                        var fragmentExecResult = _this.executeSelectionSet({
                            selectionSet: fragment.selectionSet,
                            rootValue: rootValue,
                            execContext: execContext,
                        });
                        if (match === 'heuristic' && fragmentExecResult.missing) {
                            fragmentExecResult = __assign({}, fragmentExecResult, { missing: fragmentExecResult.missing.map(function (info) {
                                    return __assign({}, info, { tolerable: true });
                                }) });
                        }
                        objectsToMerge.push(handleMissing(fragmentExecResult));
                    }
                }
            });
            finalResult.result = mergeDeepArray(objectsToMerge);
            if (this.freezeResults && process.env.NODE_ENV !== 'production') {
                Object.freeze(finalResult.result);
            }
            return finalResult;
        };
        StoreReader.prototype.executeField = function (object, typename, field, execContext) {
            var variables = execContext.variableValues, contextValue = execContext.contextValue;
            var fieldName = field.name.value;
            var args = argumentsObjectFromField(field, variables);
            var info = {
                resultKey: resultKeyNameFromField(field),
                directives: getDirectiveInfoFromField(field, variables),
            };
            var readStoreResult = readStoreResolver(object, typename, fieldName, args, contextValue, info);
            if (Array.isArray(readStoreResult.result)) {
                return this.combineExecResults(readStoreResult, this.executeSubSelectedArray({
                    field: field,
                    array: readStoreResult.result,
                    execContext: execContext,
                }));
            }
            if (!field.selectionSet) {
                assertSelectionSetForIdValue(field, readStoreResult.result);
                if (this.freezeResults && process.env.NODE_ENV !== 'production') {
                    maybeDeepFreeze(readStoreResult);
                }
                return readStoreResult;
            }
            if (readStoreResult.result == null) {
                return readStoreResult;
            }
            return this.combineExecResults(readStoreResult, this.executeSelectionSet({
                selectionSet: field.selectionSet,
                rootValue: readStoreResult.result,
                execContext: execContext,
            }));
        };
        StoreReader.prototype.combineExecResults = function () {
            var execResults = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                execResults[_i] = arguments[_i];
            }
            var missing;
            execResults.forEach(function (execResult) {
                if (execResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, execResult.missing);
                }
            });
            return {
                result: execResults.pop().result,
                missing: missing,
            };
        };
        StoreReader.prototype.executeSubSelectedArray = function (_a) {
            var _this = this;
            var field = _a.field, array = _a.array, execContext = _a.execContext;
            var missing;
            function handleMissing(childResult) {
                if (childResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, childResult.missing);
                }
                return childResult.result;
            }
            array = array.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return handleMissing(_this.executeSubSelectedArray({
                        field: field,
                        array: item,
                        execContext: execContext,
                    }));
                }
                if (field.selectionSet) {
                    return handleMissing(_this.executeSelectionSet({
                        selectionSet: field.selectionSet,
                        rootValue: item,
                        execContext: execContext,
                    }));
                }
                assertSelectionSetForIdValue(field, item);
                return item;
            });
            if (this.freezeResults && process.env.NODE_ENV !== 'production') {
                Object.freeze(array);
            }
            return { result: array, missing: missing };
        };
        return StoreReader;
    }());
    function assertSelectionSetForIdValue(field, value) {
        if (!field.selectionSet && isIdValue(value)) {
            throw process.env.NODE_ENV === "production" ? new InvariantError(10) : new InvariantError("Missing selection set for object of type " + value.typename + " returned for query field " + field.name.value);
        }
    }
    function defaultFragmentMatcher() {
        return true;
    }
    function readStoreResolver(object, typename, fieldName, args, context, _a) {
        var resultKey = _a.resultKey, directives = _a.directives;
        var storeKeyName = fieldName;
        if (args || directives) {
            storeKeyName = getStoreKeyName(storeKeyName, args, directives);
        }
        var fieldValue = void 0;
        if (object) {
            fieldValue = object[storeKeyName];
            if (typeof fieldValue === 'undefined' &&
                context.cacheRedirects &&
                typeof typename === 'string') {
                var type = context.cacheRedirects[typename];
                if (type) {
                    var resolver = type[fieldName];
                    if (resolver) {
                        fieldValue = resolver(object, args, {
                            getCacheKey: function (storeObj) {
                                var id = context.dataIdFromObject(storeObj);
                                return id && toIdValue({
                                    id: id,
                                    typename: storeObj.__typename,
                                });
                            },
                        });
                    }
                }
            }
        }
        if (typeof fieldValue === 'undefined') {
            return {
                result: fieldValue,
                missing: [{
                        object: object,
                        fieldName: storeKeyName,
                        tolerable: false,
                    }],
            };
        }
        if (isJsonValue(fieldValue)) {
            fieldValue = fieldValue.json;
        }
        return {
            result: fieldValue,
        };
    }

    var ObjectCache = (function () {
        function ObjectCache(data) {
            if (data === void 0) { data = Object.create(null); }
            this.data = data;
        }
        ObjectCache.prototype.toObject = function () {
            return this.data;
        };
        ObjectCache.prototype.get = function (dataId) {
            return this.data[dataId];
        };
        ObjectCache.prototype.set = function (dataId, value) {
            this.data[dataId] = value;
        };
        ObjectCache.prototype.delete = function (dataId) {
            this.data[dataId] = void 0;
        };
        ObjectCache.prototype.clear = function () {
            this.data = Object.create(null);
        };
        ObjectCache.prototype.replace = function (newData) {
            this.data = newData || Object.create(null);
        };
        return ObjectCache;
    }());

    var WriteError = (function (_super) {
        __extends(WriteError, _super);
        function WriteError() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = 'WriteError';
            return _this;
        }
        return WriteError;
    }(Error));
    function enhanceErrorWithDocument(error, document) {
        var enhancedError = new WriteError("Error writing result to store for query:\n " + JSON.stringify(document));
        enhancedError.message += '\n' + error.message;
        enhancedError.stack = error.stack;
        return enhancedError;
    }
    var StoreWriter = (function () {
        function StoreWriter() {
        }
        StoreWriter.prototype.writeQueryToStore = function (_a) {
            var query = _a.query, result = _a.result, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
            return this.writeResultToStore({
                dataId: 'ROOT_QUERY',
                result: result,
                document: query,
                store: store,
                variables: variables,
                dataIdFromObject: dataIdFromObject,
                fragmentMatcherFunction: fragmentMatcherFunction,
            });
        };
        StoreWriter.prototype.writeResultToStore = function (_a) {
            var dataId = _a.dataId, result = _a.result, document = _a.document, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
            var operationDefinition = getOperationDefinition(document);
            try {
                return this.writeSelectionSetToStore({
                    result: result,
                    dataId: dataId,
                    selectionSet: operationDefinition.selectionSet,
                    context: {
                        store: store,
                        processedData: {},
                        variables: assign$1({}, getDefaultValues(operationDefinition), variables),
                        dataIdFromObject: dataIdFromObject,
                        fragmentMap: createFragmentMap(getFragmentDefinitions(document)),
                        fragmentMatcherFunction: fragmentMatcherFunction,
                    },
                });
            }
            catch (e) {
                throw enhanceErrorWithDocument(e, document);
            }
        };
        StoreWriter.prototype.writeSelectionSetToStore = function (_a) {
            var _this = this;
            var result = _a.result, dataId = _a.dataId, selectionSet = _a.selectionSet, context = _a.context;
            var variables = context.variables, store = context.store, fragmentMap = context.fragmentMap;
            selectionSet.selections.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables)) {
                    return;
                }
                if (isField(selection)) {
                    var resultFieldKey = resultKeyNameFromField(selection);
                    var value = result[resultFieldKey];
                    if (typeof value !== 'undefined') {
                        _this.writeFieldToStore({
                            dataId: dataId,
                            value: value,
                            field: selection,
                            context: context,
                        });
                    }
                    else {
                        var isDefered = false;
                        var isClient = false;
                        if (selection.directives && selection.directives.length) {
                            isDefered = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'defer'; });
                            isClient = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'client'; });
                        }
                        if (!isDefered && !isClient && context.fragmentMatcherFunction) {
                            process.env.NODE_ENV === "production" || invariant.warn("Missing field " + resultFieldKey + " in " + JSON.stringify(result, null, 2).substring(0, 100));
                        }
                    }
                }
                else {
                    var fragment = void 0;
                    if (isInlineFragment(selection)) {
                        fragment = selection;
                    }
                    else {
                        fragment = (fragmentMap || {})[selection.name.value];
                        process.env.NODE_ENV === "production" ? invariant(fragment, 2) : invariant(fragment, "No fragment named " + selection.name.value + ".");
                    }
                    var matches = true;
                    if (context.fragmentMatcherFunction && fragment.typeCondition) {
                        var id = dataId || 'self';
                        var idValue = toIdValue({ id: id, typename: undefined });
                        var fakeContext = {
                            store: new ObjectCache((_a = {}, _a[id] = result, _a)),
                            cacheRedirects: {},
                        };
                        var match = context.fragmentMatcherFunction(idValue, fragment.typeCondition.name.value, fakeContext);
                        if (!isProduction() && match === 'heuristic') {
                            process.env.NODE_ENV === "production" || invariant.error('WARNING: heuristic fragment matching going on!');
                        }
                        matches = !!match;
                    }
                    if (matches) {
                        _this.writeSelectionSetToStore({
                            result: result,
                            selectionSet: fragment.selectionSet,
                            dataId: dataId,
                            context: context,
                        });
                    }
                }
            });
            return store;
        };
        StoreWriter.prototype.writeFieldToStore = function (_a) {
            var _b;
            var field = _a.field, value = _a.value, dataId = _a.dataId, context = _a.context;
            var variables = context.variables, dataIdFromObject = context.dataIdFromObject, store = context.store;
            var storeValue;
            var storeObject;
            var storeFieldName = storeKeyNameFromField(field, variables);
            if (!field.selectionSet || value === null) {
                storeValue =
                    value != null && typeof value === 'object'
                        ?
                            { type: 'json', json: value }
                        :
                            value;
            }
            else if (Array.isArray(value)) {
                var generatedId = dataId + "." + storeFieldName;
                storeValue = this.processArrayValue(value, generatedId, field.selectionSet, context);
            }
            else {
                var valueDataId = dataId + "." + storeFieldName;
                var generated = true;
                if (!isGeneratedId(valueDataId)) {
                    valueDataId = '$' + valueDataId;
                }
                if (dataIdFromObject) {
                    var semanticId = dataIdFromObject(value);
                    process.env.NODE_ENV === "production" ? invariant(!semanticId || !isGeneratedId(semanticId), 3) : invariant(!semanticId || !isGeneratedId(semanticId), 'IDs returned by dataIdFromObject cannot begin with the "$" character.');
                    if (semanticId ||
                        (typeof semanticId === 'number' && semanticId === 0)) {
                        valueDataId = semanticId;
                        generated = false;
                    }
                }
                if (!isDataProcessed(valueDataId, field, context.processedData)) {
                    this.writeSelectionSetToStore({
                        dataId: valueDataId,
                        result: value,
                        selectionSet: field.selectionSet,
                        context: context,
                    });
                }
                var typename = value.__typename;
                storeValue = toIdValue({ id: valueDataId, typename: typename }, generated);
                storeObject = store.get(dataId);
                var escapedId = storeObject && storeObject[storeFieldName];
                if (escapedId !== storeValue && isIdValue(escapedId)) {
                    var hadTypename = escapedId.typename !== undefined;
                    var hasTypename = typename !== undefined;
                    var typenameChanged = hadTypename && hasTypename && escapedId.typename !== typename;
                    process.env.NODE_ENV === "production" ? invariant(!generated || escapedId.generated || typenameChanged, 4) : invariant(!generated || escapedId.generated || typenameChanged, "Store error: the application attempted to write an object with no provided id but the store already contains an id of " + escapedId.id + " for this object. The selectionSet that was trying to be written is:\n" + JSON.stringify(field));
                    process.env.NODE_ENV === "production" ? invariant(!hadTypename || hasTypename, 5) : invariant(!hadTypename || hasTypename, "Store error: the application attempted to write an object with no provided typename but the store already contains an object with typename of " + escapedId.typename + " for the object of id " + escapedId.id + ". The selectionSet that was trying to be written is:\n" + JSON.stringify(field));
                    if (escapedId.generated) {
                        if (typenameChanged) {
                            if (!generated) {
                                store.delete(escapedId.id);
                            }
                        }
                        else {
                            mergeWithGenerated(escapedId.id, storeValue.id, store);
                        }
                    }
                }
            }
            storeObject = store.get(dataId);
            if (!storeObject || !equal(storeValue, storeObject[storeFieldName])) {
                store.set(dataId, __assign({}, storeObject, (_b = {}, _b[storeFieldName] = storeValue, _b)));
            }
        };
        StoreWriter.prototype.processArrayValue = function (value, generatedId, selectionSet, context) {
            var _this = this;
            return value.map(function (item, index) {
                if (item === null) {
                    return null;
                }
                var itemDataId = generatedId + "." + index;
                if (Array.isArray(item)) {
                    return _this.processArrayValue(item, itemDataId, selectionSet, context);
                }
                var generated = true;
                if (context.dataIdFromObject) {
                    var semanticId = context.dataIdFromObject(item);
                    if (semanticId) {
                        itemDataId = semanticId;
                        generated = false;
                    }
                }
                if (!isDataProcessed(itemDataId, selectionSet, context.processedData)) {
                    _this.writeSelectionSetToStore({
                        dataId: itemDataId,
                        result: item,
                        selectionSet: selectionSet,
                        context: context,
                    });
                }
                return toIdValue({ id: itemDataId, typename: item.__typename }, generated);
            });
        };
        return StoreWriter;
    }());
    function isGeneratedId(id) {
        return id[0] === '$';
    }
    function mergeWithGenerated(generatedKey, realKey, cache) {
        if (generatedKey === realKey) {
            return false;
        }
        var generated = cache.get(generatedKey);
        var real = cache.get(realKey);
        var madeChanges = false;
        Object.keys(generated).forEach(function (key) {
            var value = generated[key];
            var realValue = real[key];
            if (isIdValue(value) &&
                isGeneratedId(value.id) &&
                isIdValue(realValue) &&
                !equal(value, realValue) &&
                mergeWithGenerated(value.id, realValue.id, cache)) {
                madeChanges = true;
            }
        });
        cache.delete(generatedKey);
        var newRealValue = __assign({}, generated, real);
        if (equal(newRealValue, real)) {
            return madeChanges;
        }
        cache.set(realKey, newRealValue);
        return true;
    }
    function isDataProcessed(dataId, field, processedData) {
        if (!processedData) {
            return false;
        }
        if (processedData[dataId]) {
            if (processedData[dataId].indexOf(field) >= 0) {
                return true;
            }
            else {
                processedData[dataId].push(field);
            }
        }
        else {
            processedData[dataId] = [field];
        }
        return false;
    }

    var defaultConfig = {
        fragmentMatcher: new HeuristicFragmentMatcher(),
        dataIdFromObject: defaultDataIdFromObject,
        addTypename: true,
        resultCaching: true,
        freezeResults: false,
    };
    function defaultDataIdFromObject(result) {
        if (result.__typename) {
            if (result.id !== undefined) {
                return result.__typename + ":" + result.id;
            }
            if (result._id !== undefined) {
                return result.__typename + ":" + result._id;
            }
        }
        return null;
    }
    var hasOwn$1 = Object.prototype.hasOwnProperty;
    var OptimisticCacheLayer = (function (_super) {
        __extends(OptimisticCacheLayer, _super);
        function OptimisticCacheLayer(optimisticId, parent, transaction) {
            var _this = _super.call(this, Object.create(null)) || this;
            _this.optimisticId = optimisticId;
            _this.parent = parent;
            _this.transaction = transaction;
            return _this;
        }
        OptimisticCacheLayer.prototype.toObject = function () {
            return __assign({}, this.parent.toObject(), this.data);
        };
        OptimisticCacheLayer.prototype.get = function (dataId) {
            return hasOwn$1.call(this.data, dataId)
                ? this.data[dataId]
                : this.parent.get(dataId);
        };
        return OptimisticCacheLayer;
    }(ObjectCache));
    var InMemoryCache = (function (_super) {
        __extends(InMemoryCache, _super);
        function InMemoryCache(config) {
            if (config === void 0) { config = {}; }
            var _this = _super.call(this) || this;
            _this.watches = new Set();
            _this.typenameDocumentCache = new Map();
            _this.cacheKeyRoot = new KeyTrie(canUseWeakMap);
            _this.silenceBroadcast = false;
            _this.config = __assign({}, defaultConfig, config);
            if (_this.config.customResolvers) {
                process.env.NODE_ENV === "production" || invariant.warn('customResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating customResolvers in the next major version.');
                _this.config.cacheRedirects = _this.config.customResolvers;
            }
            if (_this.config.cacheResolvers) {
                process.env.NODE_ENV === "production" || invariant.warn('cacheResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating cacheResolvers in the next major version.');
                _this.config.cacheRedirects = _this.config.cacheResolvers;
            }
            _this.addTypename = !!_this.config.addTypename;
            _this.data = _this.config.resultCaching
                ? new DepTrackingCache()
                : new ObjectCache();
            _this.optimisticData = _this.data;
            _this.storeWriter = new StoreWriter();
            _this.storeReader = new StoreReader({
                cacheKeyRoot: _this.cacheKeyRoot,
                freezeResults: config.freezeResults,
            });
            var cache = _this;
            var maybeBroadcastWatch = cache.maybeBroadcastWatch;
            _this.maybeBroadcastWatch = wrap(function (c) {
                return maybeBroadcastWatch.call(_this, c);
            }, {
                makeCacheKey: function (c) {
                    if (c.optimistic) {
                        return;
                    }
                    if (c.previousResult) {
                        return;
                    }
                    if (cache.data instanceof DepTrackingCache) {
                        return cache.cacheKeyRoot.lookup(c.query, JSON.stringify(c.variables));
                    }
                }
            });
            return _this;
        }
        InMemoryCache.prototype.restore = function (data) {
            if (data)
                this.data.replace(data);
            return this;
        };
        InMemoryCache.prototype.extract = function (optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return (optimistic ? this.optimisticData : this.data).toObject();
        };
        InMemoryCache.prototype.read = function (options) {
            if (typeof options.rootId === 'string' &&
                typeof this.data.get(options.rootId) === 'undefined') {
                return null;
            }
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            return this.storeReader.readQueryFromStore({
                store: options.optimistic ? this.optimisticData : this.data,
                query: this.transformDocument(options.query),
                variables: options.variables,
                rootId: options.rootId,
                fragmentMatcherFunction: fragmentMatcherFunction,
                previousResult: options.previousResult,
                config: this.config,
            }) || null;
        };
        InMemoryCache.prototype.write = function (write) {
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            this.storeWriter.writeResultToStore({
                dataId: write.dataId,
                result: write.result,
                variables: write.variables,
                document: this.transformDocument(write.query),
                store: this.data,
                dataIdFromObject: this.config.dataIdFromObject,
                fragmentMatcherFunction: fragmentMatcherFunction,
            });
            this.broadcastWatches();
        };
        InMemoryCache.prototype.diff = function (query) {
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            return this.storeReader.diffQueryAgainstStore({
                store: query.optimistic ? this.optimisticData : this.data,
                query: this.transformDocument(query.query),
                variables: query.variables,
                returnPartialData: query.returnPartialData,
                previousResult: query.previousResult,
                fragmentMatcherFunction: fragmentMatcherFunction,
                config: this.config,
            });
        };
        InMemoryCache.prototype.watch = function (watch) {
            var _this = this;
            this.watches.add(watch);
            return function () {
                _this.watches.delete(watch);
            };
        };
        InMemoryCache.prototype.evict = function (query) {
            throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("eviction is not implemented on InMemory Cache");
        };
        InMemoryCache.prototype.reset = function () {
            this.data.clear();
            this.broadcastWatches();
            return Promise.resolve();
        };
        InMemoryCache.prototype.removeOptimistic = function (idToRemove) {
            var toReapply = [];
            var removedCount = 0;
            var layer = this.optimisticData;
            while (layer instanceof OptimisticCacheLayer) {
                if (layer.optimisticId === idToRemove) {
                    ++removedCount;
                }
                else {
                    toReapply.push(layer);
                }
                layer = layer.parent;
            }
            if (removedCount > 0) {
                this.optimisticData = layer;
                while (toReapply.length > 0) {
                    var layer_1 = toReapply.pop();
                    this.performTransaction(layer_1.transaction, layer_1.optimisticId);
                }
                this.broadcastWatches();
            }
        };
        InMemoryCache.prototype.performTransaction = function (transaction, optimisticId) {
            var _a = this, data = _a.data, silenceBroadcast = _a.silenceBroadcast;
            this.silenceBroadcast = true;
            if (typeof optimisticId === 'string') {
                this.data = this.optimisticData = new OptimisticCacheLayer(optimisticId, this.optimisticData, transaction);
            }
            try {
                transaction(this);
            }
            finally {
                this.silenceBroadcast = silenceBroadcast;
                this.data = data;
            }
            this.broadcastWatches();
        };
        InMemoryCache.prototype.recordOptimisticTransaction = function (transaction, id) {
            return this.performTransaction(transaction, id);
        };
        InMemoryCache.prototype.transformDocument = function (document) {
            if (this.addTypename) {
                var result = this.typenameDocumentCache.get(document);
                if (!result) {
                    result = addTypenameToDocument(document);
                    this.typenameDocumentCache.set(document, result);
                    this.typenameDocumentCache.set(result, result);
                }
                return result;
            }
            return document;
        };
        InMemoryCache.prototype.broadcastWatches = function () {
            var _this = this;
            if (!this.silenceBroadcast) {
                this.watches.forEach(function (c) { return _this.maybeBroadcastWatch(c); });
            }
        };
        InMemoryCache.prototype.maybeBroadcastWatch = function (c) {
            c.callback(this.diff({
                query: c.query,
                variables: c.variables,
                previousResult: c.previousResult && c.previousResult(),
                optimistic: c.optimistic,
            }));
        };
        return InMemoryCache;
    }(ApolloCache));
    //# sourceMappingURL=bundle.esm.js.map

    /**
     * Produces the value of a block string from its parsed raw value, similar to
     * CoffeeScript's block string, Python's docstring trim or Ruby's strip_heredoc.
     *
     * This implements the GraphQL spec's BlockStringValue() static algorithm.
     */
    function dedentBlockStringValue(rawString) {
      // Expand a block string's raw value into independent lines.
      var lines = rawString.split(/\r\n|[\n\r]/g); // Remove common indentation from all lines but first.

      var commonIndent = getBlockStringIndentation(lines);

      if (commonIndent !== 0) {
        for (var i = 1; i < lines.length; i++) {
          lines[i] = lines[i].slice(commonIndent);
        }
      } // Remove leading and trailing blank lines.


      while (lines.length > 0 && isBlank(lines[0])) {
        lines.shift();
      }

      while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
        lines.pop();
      } // Return a string of the lines joined with U+000A.


      return lines.join('\n');
    } // @internal

    function getBlockStringIndentation(lines) {
      var commonIndent = null;

      for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        var indent = leadingWhitespace(line);

        if (indent === line.length) {
          continue; // skip empty lines
        }

        if (commonIndent === null || indent < commonIndent) {
          commonIndent = indent;

          if (commonIndent === 0) {
            break;
          }
        }
      }

      return commonIndent === null ? 0 : commonIndent;
    }

    function leadingWhitespace(str) {
      var i = 0;

      while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
        i++;
      }

      return i;
    }

    function isBlank(str) {
      return leadingWhitespace(str) === str.length;
    }
    /**
     * Print a block string in the indented block form by adding a leading and
     * trailing blank line. However, if a block string starts with whitespace and is
     * a single-line, adding a leading blank line would strip that whitespace.
     */


    function printBlockString(value) {
      var indentation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var preferMultipleLines = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var isSingleLine = value.indexOf('\n') === -1;
      var hasLeadingSpace = value[0] === ' ' || value[0] === '\t';
      var hasTrailingQuote = value[value.length - 1] === '"';
      var printAsMultipleLines = !isSingleLine || hasTrailingQuote || preferMultipleLines;
      var result = ''; // Format a multi-line block quote to account for leading space.

      if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
        result += '\n' + indentation;
      }

      result += indentation ? value.replace(/\n/g, '\n' + indentation) : value;

      if (printAsMultipleLines) {
        result += '\n';
      }

      return '"""' + result.replace(/"""/g, '\\"""') + '"""';
    }

    /**
     * Converts an AST into a string, using one set of reasonable
     * formatting rules.
     */

    function print(ast) {
      return visit(ast, {
        leave: printDocASTReducer
      });
    } // TODO: provide better type coverage in future

    var printDocASTReducer = {
      Name: function Name(node) {
        return node.value;
      },
      Variable: function Variable(node) {
        return '$' + node.name;
      },
      // Document
      Document: function Document(node) {
        return join(node.definitions, '\n\n') + '\n';
      },
      OperationDefinition: function OperationDefinition(node) {
        var op = node.operation;
        var name = node.name;
        var varDefs = wrap$1('(', join(node.variableDefinitions, ', '), ')');
        var directives = join(node.directives, ' ');
        var selectionSet = node.selectionSet; // Anonymous queries with no directives or variable definitions can use
        // the query short form.

        return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
      },
      VariableDefinition: function VariableDefinition(_ref) {
        var variable = _ref.variable,
            type = _ref.type,
            defaultValue = _ref.defaultValue,
            directives = _ref.directives;
        return variable + ': ' + type + wrap$1(' = ', defaultValue) + wrap$1(' ', join(directives, ' '));
      },
      SelectionSet: function SelectionSet(_ref2) {
        var selections = _ref2.selections;
        return block(selections);
      },
      Field: function Field(_ref3) {
        var alias = _ref3.alias,
            name = _ref3.name,
            args = _ref3.arguments,
            directives = _ref3.directives,
            selectionSet = _ref3.selectionSet;
        return join([wrap$1('', alias, ': ') + name + wrap$1('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
      },
      Argument: function Argument(_ref4) {
        var name = _ref4.name,
            value = _ref4.value;
        return name + ': ' + value;
      },
      // Fragments
      FragmentSpread: function FragmentSpread(_ref5) {
        var name = _ref5.name,
            directives = _ref5.directives;
        return '...' + name + wrap$1(' ', join(directives, ' '));
      },
      InlineFragment: function InlineFragment(_ref6) {
        var typeCondition = _ref6.typeCondition,
            directives = _ref6.directives,
            selectionSet = _ref6.selectionSet;
        return join(['...', wrap$1('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
      },
      FragmentDefinition: function FragmentDefinition(_ref7) {
        var name = _ref7.name,
            typeCondition = _ref7.typeCondition,
            variableDefinitions = _ref7.variableDefinitions,
            directives = _ref7.directives,
            selectionSet = _ref7.selectionSet;
        return (// Note: fragment variable definitions are experimental and may be changed
          // or removed in the future.
          "fragment ".concat(name).concat(wrap$1('(', join(variableDefinitions, ', '), ')'), " ") + "on ".concat(typeCondition, " ").concat(wrap$1('', join(directives, ' '), ' ')) + selectionSet
        );
      },
      // Value
      IntValue: function IntValue(_ref8) {
        var value = _ref8.value;
        return value;
      },
      FloatValue: function FloatValue(_ref9) {
        var value = _ref9.value;
        return value;
      },
      StringValue: function StringValue(_ref10, key) {
        var value = _ref10.value,
            isBlockString = _ref10.block;
        return isBlockString ? printBlockString(value, key === 'description' ? '' : '  ') : JSON.stringify(value);
      },
      BooleanValue: function BooleanValue(_ref11) {
        var value = _ref11.value;
        return value ? 'true' : 'false';
      },
      NullValue: function NullValue() {
        return 'null';
      },
      EnumValue: function EnumValue(_ref12) {
        var value = _ref12.value;
        return value;
      },
      ListValue: function ListValue(_ref13) {
        var values = _ref13.values;
        return '[' + join(values, ', ') + ']';
      },
      ObjectValue: function ObjectValue(_ref14) {
        var fields = _ref14.fields;
        return '{' + join(fields, ', ') + '}';
      },
      ObjectField: function ObjectField(_ref15) {
        var name = _ref15.name,
            value = _ref15.value;
        return name + ': ' + value;
      },
      // Directive
      Directive: function Directive(_ref16) {
        var name = _ref16.name,
            args = _ref16.arguments;
        return '@' + name + wrap$1('(', join(args, ', '), ')');
      },
      // Type
      NamedType: function NamedType(_ref17) {
        var name = _ref17.name;
        return name;
      },
      ListType: function ListType(_ref18) {
        var type = _ref18.type;
        return '[' + type + ']';
      },
      NonNullType: function NonNullType(_ref19) {
        var type = _ref19.type;
        return type + '!';
      },
      // Type System Definitions
      SchemaDefinition: function SchemaDefinition(_ref20) {
        var directives = _ref20.directives,
            operationTypes = _ref20.operationTypes;
        return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
        var operation = _ref21.operation,
            type = _ref21.type;
        return operation + ': ' + type;
      },
      ScalarTypeDefinition: addDescription(function (_ref22) {
        var name = _ref22.name,
            directives = _ref22.directives;
        return join(['scalar', name, join(directives, ' ')], ' ');
      }),
      ObjectTypeDefinition: addDescription(function (_ref23) {
        var name = _ref23.name,
            interfaces = _ref23.interfaces,
            directives = _ref23.directives,
            fields = _ref23.fields;
        return join(['type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      }),
      FieldDefinition: addDescription(function (_ref24) {
        var name = _ref24.name,
            args = _ref24.arguments,
            type = _ref24.type,
            directives = _ref24.directives;
        return name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + ': ' + type + wrap$1(' ', join(directives, ' '));
      }),
      InputValueDefinition: addDescription(function (_ref25) {
        var name = _ref25.name,
            type = _ref25.type,
            defaultValue = _ref25.defaultValue,
            directives = _ref25.directives;
        return join([name + ': ' + type, wrap$1('= ', defaultValue), join(directives, ' ')], ' ');
      }),
      InterfaceTypeDefinition: addDescription(function (_ref26) {
        var name = _ref26.name,
            directives = _ref26.directives,
            fields = _ref26.fields;
        return join(['interface', name, join(directives, ' '), block(fields)], ' ');
      }),
      UnionTypeDefinition: addDescription(function (_ref27) {
        var name = _ref27.name,
            directives = _ref27.directives,
            types = _ref27.types;
        return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      }),
      EnumTypeDefinition: addDescription(function (_ref28) {
        var name = _ref28.name,
            directives = _ref28.directives,
            values = _ref28.values;
        return join(['enum', name, join(directives, ' '), block(values)], ' ');
      }),
      EnumValueDefinition: addDescription(function (_ref29) {
        var name = _ref29.name,
            directives = _ref29.directives;
        return join([name, join(directives, ' ')], ' ');
      }),
      InputObjectTypeDefinition: addDescription(function (_ref30) {
        var name = _ref30.name,
            directives = _ref30.directives,
            fields = _ref30.fields;
        return join(['input', name, join(directives, ' '), block(fields)], ' ');
      }),
      DirectiveDefinition: addDescription(function (_ref31) {
        var name = _ref31.name,
            args = _ref31.arguments,
            repeatable = _ref31.repeatable,
            locations = _ref31.locations;
        return 'directive @' + name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + (repeatable ? ' repeatable' : '') + ' on ' + join(locations, ' | ');
      }),
      SchemaExtension: function SchemaExtension(_ref32) {
        var directives = _ref32.directives,
            operationTypes = _ref32.operationTypes;
        return join(['extend schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
        var name = _ref33.name,
            directives = _ref33.directives;
        return join(['extend scalar', name, join(directives, ' ')], ' ');
      },
      ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
        var name = _ref34.name,
            interfaces = _ref34.interfaces,
            directives = _ref34.directives,
            fields = _ref34.fields;
        return join(['extend type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      },
      InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
        var name = _ref35.name,
            directives = _ref35.directives,
            fields = _ref35.fields;
        return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
      },
      UnionTypeExtension: function UnionTypeExtension(_ref36) {
        var name = _ref36.name,
            directives = _ref36.directives,
            types = _ref36.types;
        return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      },
      EnumTypeExtension: function EnumTypeExtension(_ref37) {
        var name = _ref37.name,
            directives = _ref37.directives,
            values = _ref37.values;
        return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
      },
      InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
        var name = _ref38.name,
            directives = _ref38.directives,
            fields = _ref38.fields;
        return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
      }
    };

    function addDescription(cb) {
      return function (node) {
        return join([node.description, cb(node)], '\n');
      };
    }
    /**
     * Given maybeArray, print an empty string if it is null or empty, otherwise
     * print all items together separated by separator if provided
     */


    function join(maybeArray, separator) {
      return maybeArray ? maybeArray.filter(function (x) {
        return x;
      }).join(separator || '') : '';
    }
    /**
     * Given array, print each item on its own line, wrapped in an
     * indented "{ }" block.
     */


    function block(array) {
      return array && array.length !== 0 ? '{\n' + indent(join(array, '\n')) + '\n}' : '';
    }
    /**
     * If maybeString is not null or empty, then wrap with start and end, otherwise
     * print an empty string.
     */


    function wrap$1(start, maybeString, end) {
      return maybeString ? start + maybeString + (end || '') : '';
    }

    function indent(maybeString) {
      return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
    }

    function isMultiline(string) {
      return string.indexOf('\n') !== -1;
    }

    function hasMultilineItems(maybeArray) {
      return maybeArray && maybeArray.some(isMultiline);
    }

    var printer = /*#__PURE__*/Object.freeze({
        print: print
    });

    var defaultHttpOptions = {
        includeQuery: true,
        includeExtensions: false,
    };
    var defaultHeaders = {
        accept: '*/*',
        'content-type': 'application/json',
    };
    var defaultOptions = {
        method: 'POST',
    };
    var fallbackHttpConfig = {
        http: defaultHttpOptions,
        headers: defaultHeaders,
        options: defaultOptions,
    };
    var throwServerError = function (response, result, message) {
        var error = new Error(message);
        error.name = 'ServerError';
        error.response = response;
        error.statusCode = response.status;
        error.result = result;
        throw error;
    };
    var parseAndCheckHttpResponse = function (operations) { return function (response) {
        return (response
            .text()
            .then(function (bodyText) {
            try {
                return JSON.parse(bodyText);
            }
            catch (err) {
                var parseError = err;
                parseError.name = 'ServerParseError';
                parseError.response = response;
                parseError.statusCode = response.status;
                parseError.bodyText = bodyText;
                return Promise.reject(parseError);
            }
        })
            .then(function (result) {
            if (response.status >= 300) {
                throwServerError(response, result, "Response not successful: Received status code " + response.status);
            }
            if (!Array.isArray(result) &&
                !result.hasOwnProperty('data') &&
                !result.hasOwnProperty('errors')) {
                throwServerError(response, result, "Server response was missing for query '" + (Array.isArray(operations)
                    ? operations.map(function (op) { return op.operationName; })
                    : operations.operationName) + "'.");
            }
            return result;
        }));
    }; };
    var checkFetcher = function (fetcher) {
        if (!fetcher && typeof fetch === 'undefined') {
            var library = 'unfetch';
            if (typeof window === 'undefined')
                library = 'node-fetch';
            throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("\nfetch is not found globally and no fetcher passed, to fix pass a fetch for\nyour environment like https://www.npmjs.com/package/" + library + ".\n\nFor example:\nimport fetch from '" + library + "';\nimport { createHttpLink } from 'apollo-link-http';\n\nconst link = createHttpLink({ uri: '/graphql', fetch: fetch });");
        }
    };
    var createSignalIfSupported = function () {
        if (typeof AbortController === 'undefined')
            return { controller: false, signal: false };
        var controller = new AbortController();
        var signal = controller.signal;
        return { controller: controller, signal: signal };
    };
    var selectHttpOptionsAndBody = function (operation, fallbackConfig) {
        var configs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            configs[_i - 2] = arguments[_i];
        }
        var options = __assign({}, fallbackConfig.options, { headers: fallbackConfig.headers, credentials: fallbackConfig.credentials });
        var http = fallbackConfig.http;
        configs.forEach(function (config) {
            options = __assign({}, options, config.options, { headers: __assign({}, options.headers, config.headers) });
            if (config.credentials)
                options.credentials = config.credentials;
            http = __assign({}, http, config.http);
        });
        var operationName = operation.operationName, extensions = operation.extensions, variables = operation.variables, query = operation.query;
        var body = { operationName: operationName, variables: variables };
        if (http.includeExtensions)
            body.extensions = extensions;
        if (http.includeQuery)
            body.query = print(query);
        return {
            options: options,
            body: body,
        };
    };
    var serializeFetchParameter = function (p, label) {
        var serialized;
        try {
            serialized = JSON.stringify(p);
        }
        catch (e) {
            var parseError = process.env.NODE_ENV === "production" ? new InvariantError(2) : new InvariantError("Network request failed. " + label + " is not serializable: " + e.message);
            parseError.parseError = e;
            throw parseError;
        }
        return serialized;
    };
    var selectURI = function (operation, fallbackURI) {
        var context = operation.getContext();
        var contextURI = context.uri;
        if (contextURI) {
            return contextURI;
        }
        else if (typeof fallbackURI === 'function') {
            return fallbackURI(operation);
        }
        else {
            return fallbackURI || '/graphql';
        }
    };
    //# sourceMappingURL=bundle.esm.js.map

    var createHttpLink = function (linkOptions) {
        if (linkOptions === void 0) { linkOptions = {}; }
        var _a = linkOptions.uri, uri = _a === void 0 ? '/graphql' : _a, fetcher = linkOptions.fetch, includeExtensions = linkOptions.includeExtensions, useGETForQueries = linkOptions.useGETForQueries, requestOptions = __rest(linkOptions, ["uri", "fetch", "includeExtensions", "useGETForQueries"]);
        checkFetcher(fetcher);
        if (!fetcher) {
            fetcher = fetch;
        }
        var linkConfig = {
            http: { includeExtensions: includeExtensions },
            options: requestOptions.fetchOptions,
            credentials: requestOptions.credentials,
            headers: requestOptions.headers,
        };
        return new ApolloLink(function (operation) {
            var chosenURI = selectURI(operation, uri);
            var context = operation.getContext();
            var clientAwarenessHeaders = {};
            if (context.clientAwareness) {
                var _a = context.clientAwareness, name_1 = _a.name, version = _a.version;
                if (name_1) {
                    clientAwarenessHeaders['apollographql-client-name'] = name_1;
                }
                if (version) {
                    clientAwarenessHeaders['apollographql-client-version'] = version;
                }
            }
            var contextHeaders = __assign({}, clientAwarenessHeaders, context.headers);
            var contextConfig = {
                http: context.http,
                options: context.fetchOptions,
                credentials: context.credentials,
                headers: contextHeaders,
            };
            var _b = selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig), options = _b.options, body = _b.body;
            var controller;
            if (!options.signal) {
                var _c = createSignalIfSupported(), _controller = _c.controller, signal = _c.signal;
                controller = _controller;
                if (controller)
                    options.signal = signal;
            }
            var definitionIsMutation = function (d) {
                return d.kind === 'OperationDefinition' && d.operation === 'mutation';
            };
            if (useGETForQueries &&
                !operation.query.definitions.some(definitionIsMutation)) {
                options.method = 'GET';
            }
            if (options.method === 'GET') {
                var _d = rewriteURIForGET(chosenURI, body), newURI = _d.newURI, parseError = _d.parseError;
                if (parseError) {
                    return fromError(parseError);
                }
                chosenURI = newURI;
            }
            else {
                try {
                    options.body = serializeFetchParameter(body, 'Payload');
                }
                catch (parseError) {
                    return fromError(parseError);
                }
            }
            return new Observable(function (observer) {
                fetcher(chosenURI, options)
                    .then(function (response) {
                    operation.setContext({ response: response });
                    return response;
                })
                    .then(parseAndCheckHttpResponse(operation))
                    .then(function (result) {
                    observer.next(result);
                    observer.complete();
                    return result;
                })
                    .catch(function (err) {
                    if (err.name === 'AbortError')
                        return;
                    if (err.result && err.result.errors && err.result.data) {
                        observer.next(err.result);
                    }
                    observer.error(err);
                });
                return function () {
                    if (controller)
                        controller.abort();
                };
            });
        });
    };
    function rewriteURIForGET(chosenURI, body) {
        var queryParams = [];
        var addQueryParam = function (key, value) {
            queryParams.push(key + "=" + encodeURIComponent(value));
        };
        if ('query' in body) {
            addQueryParam('query', body.query);
        }
        if (body.operationName) {
            addQueryParam('operationName', body.operationName);
        }
        if (body.variables) {
            var serializedVariables = void 0;
            try {
                serializedVariables = serializeFetchParameter(body.variables, 'Variables map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('variables', serializedVariables);
        }
        if (body.extensions) {
            var serializedExtensions = void 0;
            try {
                serializedExtensions = serializeFetchParameter(body.extensions, 'Extensions map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('extensions', serializedExtensions);
        }
        var fragment = '', preFragment = chosenURI;
        var fragmentStart = chosenURI.indexOf('#');
        if (fragmentStart !== -1) {
            fragment = chosenURI.substr(fragmentStart);
            preFragment = chosenURI.substr(0, fragmentStart);
        }
        var queryParamsPrefix = preFragment.indexOf('?') === -1 ? '?' : '&';
        var newURI = preFragment + queryParamsPrefix + queryParams.join('&') + fragment;
        return { newURI: newURI };
    }
    var HttpLink = (function (_super) {
        __extends(HttpLink, _super);
        function HttpLink(opts) {
            return _super.call(this, createHttpLink(opts).request) || this;
        }
        return HttpLink;
    }(ApolloLink));
    //# sourceMappingURL=bundle.esm.js.map

    /**
     * The `defineToJSON()` function defines toJSON() and inspect() prototype
     * methods, if no function provided they become aliases for toString().
     */

    function defineToJSON(classObject) {
      var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : classObject.prototype.toString;
      classObject.prototype.toJSON = fn;
      classObject.prototype.inspect = fn;

      if (nodejsCustomInspectSymbol) {
        classObject.prototype[nodejsCustomInspectSymbol] = fn;
      }
    }

    function invariant$1(condition, message) {
      var booleanCondition = Boolean(condition);
      /* istanbul ignore else */

      if (!booleanCondition) {
        throw new Error(message);
      }
    }

    /**
     * The `defineToStringTag()` function checks first to see if the runtime
     * supports the `Symbol` class and then if the `Symbol.toStringTag` constant
     * is defined as a `Symbol` instance. If both conditions are met, the
     * Symbol.toStringTag property is defined as a getter that returns the
     * supplied class constructor's name.
     *
     * @method defineToStringTag
     *
     * @param {Class<any>} classObject a class such as Object, String, Number but
     * typically one of your own creation through the class keyword; `class A {}`,
     * for example.
     */
    function defineToStringTag(classObject) {
      if (typeof Symbol === 'function' && Symbol.toStringTag) {
        Object.defineProperty(classObject.prototype, Symbol.toStringTag, {
          get: function get() {
            return this.constructor.name;
          }
        });
      }
    }

    /**
     * A representation of source input to GraphQL.
     * `name` and `locationOffset` are optional. They are useful for clients who
     * store GraphQL documents in source files; for example, if the GraphQL input
     * starts at line 40 in a file named Foo.graphql, it might be useful for name to
     * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
     * line and column in locationOffset are 1-indexed
     */
    var Source = function Source(body, name, locationOffset) {
      this.body = body;
      this.name = name || 'GraphQL request';
      this.locationOffset = locationOffset || {
        line: 1,
        column: 1
      };
      !(this.locationOffset.line > 0) ? invariant$1(0, 'line in locationOffset is 1-indexed and must be positive') : void 0;
      !(this.locationOffset.column > 0) ? invariant$1(0, 'column in locationOffset is 1-indexed and must be positive') : void 0;
    }; // Conditionally apply `[Symbol.toStringTag]` if `Symbol`s are supported

    defineToStringTag(Source);

    function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }

    /**
     * Return true if `value` is object-like. A value is object-like if it's not
     * `null` and has a `typeof` result of "object".
     */
    function isObjectLike(value) {
      return _typeof$1(value) == 'object' && value !== null;
    }

    /**
     * Represents a location in a Source.
     */

    /**
     * Takes a Source and a UTF-8 character offset, and returns the corresponding
     * line and column as a SourceLocation.
     */
    function getLocation$1(source, position) {
      var lineRegexp = /\r\n|[\n\r]/g;
      var line = 1;
      var column = position + 1;
      var match;

      while ((match = lineRegexp.exec(source.body)) && match.index < position) {
        line += 1;
        column = position + 1 - (match.index + match[0].length);
      }

      return {
        line: line,
        column: column
      };
    }

    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printLocation(location) {
      return printSourceLocation(location.source, getLocation$1(location.source, location.start));
    }
    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printSourceLocation(source, sourceLocation) {
      var firstLineColumnOffset = source.locationOffset.column - 1;
      var body = whitespace(firstLineColumnOffset) + source.body;
      var lineIndex = sourceLocation.line - 1;
      var lineOffset = source.locationOffset.line - 1;
      var lineNum = sourceLocation.line + lineOffset;
      var columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
      var columnNum = sourceLocation.column + columnOffset;
      var locationStr = "".concat(source.name, ":").concat(lineNum, ":").concat(columnNum, "\n");
      var lines = body.split(/\r\n|[\n\r]/g);
      var locationLine = lines[lineIndex]; // Special case for minified documents

      if (locationLine.length > 120) {
        var sublineIndex = Math.floor(columnNum / 80);
        var sublineColumnNum = columnNum % 80;
        var sublines = [];

        for (var i = 0; i < locationLine.length; i += 80) {
          sublines.push(locationLine.slice(i, i + 80));
        }

        return locationStr + printPrefixedLines([["".concat(lineNum), sublines[0]]].concat(sublines.slice(1, sublineIndex + 1).map(function (subline) {
          return ['', subline];
        }), [[' ', whitespace(sublineColumnNum - 1) + '^'], ['', sublines[sublineIndex + 1]]]));
      }

      return locationStr + printPrefixedLines([// Lines specified like this: ["prefix", "string"],
      ["".concat(lineNum - 1), lines[lineIndex - 1]], ["".concat(lineNum), locationLine], ['', whitespace(columnNum - 1) + '^'], ["".concat(lineNum + 1), lines[lineIndex + 1]]]);
    }

    function printPrefixedLines(lines) {
      var existingLines = lines.filter(function (_ref) {
        var _ = _ref[0],
            line = _ref[1];
        return line !== undefined;
      });
      var padLen = Math.max.apply(Math, existingLines.map(function (_ref2) {
        var prefix = _ref2[0];
        return prefix.length;
      }));
      return existingLines.map(function (_ref3) {
        var prefix = _ref3[0],
            line = _ref3[1];
        return lpad(padLen, prefix) + ' | ' + line;
      }).join('\n');
    }

    function whitespace(len) {
      return Array(len + 1).join(' ');
    }

    function lpad(len, str) {
      return whitespace(len - str.length) + str;
    }

    /**
     * A GraphQLError describes an Error found during the parse, validate, or
     * execute phases of performing a GraphQL operation. In addition to a message
     * and stack trace, it also includes information about the locations in a
     * GraphQL document and/or execution result that correspond to the Error.
     */

    function GraphQLError( // eslint-disable-line no-redeclare
    message, nodes, source, positions, path, originalError, extensions) {
      // Compute list of blame nodes.
      var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined; // Compute locations in the source for the given nodes/positions.


      var _source = source;

      if (!_source && _nodes) {
        var node = _nodes[0];
        _source = node && node.loc && node.loc.source;
      }

      var _positions = positions;

      if (!_positions && _nodes) {
        _positions = _nodes.reduce(function (list, node) {
          if (node.loc) {
            list.push(node.loc.start);
          }

          return list;
        }, []);
      }

      if (_positions && _positions.length === 0) {
        _positions = undefined;
      }

      var _locations;

      if (positions && source) {
        _locations = positions.map(function (pos) {
          return getLocation$1(source, pos);
        });
      } else if (_nodes) {
        _locations = _nodes.reduce(function (list, node) {
          if (node.loc) {
            list.push(getLocation$1(node.loc.source, node.loc.start));
          }

          return list;
        }, []);
      }

      var _extensions = extensions;

      if (_extensions == null && originalError != null) {
        var originalExtensions = originalError.extensions;

        if (isObjectLike(originalExtensions)) {
          _extensions = originalExtensions;
        }
      }

      Object.defineProperties(this, {
        message: {
          value: message,
          // By being enumerable, JSON.stringify will include `message` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: true,
          writable: true
        },
        locations: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: _locations || undefined,
          // By being enumerable, JSON.stringify will include `locations` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(_locations)
        },
        path: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: path || undefined,
          // By being enumerable, JSON.stringify will include `path` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(path)
        },
        nodes: {
          value: _nodes || undefined
        },
        source: {
          value: _source || undefined
        },
        positions: {
          value: _positions || undefined
        },
        originalError: {
          value: originalError
        },
        extensions: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: _extensions || undefined,
          // By being enumerable, JSON.stringify will include `path` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(_extensions)
        }
      }); // Include (non-enumerable) stack trace.

      if (originalError && originalError.stack) {
        Object.defineProperty(this, 'stack', {
          value: originalError.stack,
          writable: true,
          configurable: true
        });
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, GraphQLError);
      } else {
        Object.defineProperty(this, 'stack', {
          value: Error().stack,
          writable: true,
          configurable: true
        });
      }
    }
    GraphQLError.prototype = Object.create(Error.prototype, {
      constructor: {
        value: GraphQLError
      },
      name: {
        value: 'GraphQLError'
      },
      toString: {
        value: function toString() {
          return printError(this);
        }
      }
    });
    /**
     * Prints a GraphQLError to a string, representing useful location information
     * about the error's position in the source.
     */

    function printError(error) {
      var output = error.message;

      if (error.nodes) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = error.nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var node = _step.value;

            if (node.loc) {
              output += '\n\n' + printLocation(node.loc);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else if (error.source && error.locations) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = error.locations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var location = _step2.value;
            output += '\n\n' + printSourceLocation(error.source, location);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }

      return output;
    }

    /**
     * Produces a GraphQLError representing a syntax error, containing useful
     * descriptive information about the syntax error's position in the source.
     */

    function syntaxError(source, position, description) {
      return new GraphQLError("Syntax Error: ".concat(description), undefined, source, [position]);
    }

    /**
     * An exported enum describing the different kinds of tokens that the
     * lexer emits.
     */
    var TokenKind = Object.freeze({
      SOF: '<SOF>',
      EOF: '<EOF>',
      BANG: '!',
      DOLLAR: '$',
      AMP: '&',
      PAREN_L: '(',
      PAREN_R: ')',
      SPREAD: '...',
      COLON: ':',
      EQUALS: '=',
      AT: '@',
      BRACKET_L: '[',
      BRACKET_R: ']',
      BRACE_L: '{',
      PIPE: '|',
      BRACE_R: '}',
      NAME: 'Name',
      INT: 'Int',
      FLOAT: 'Float',
      STRING: 'String',
      BLOCK_STRING: 'BlockString',
      COMMENT: 'Comment'
    });
    /**
     * The enum type representing the token kinds values.
     */

    /**
     * Given a Source object, this returns a Lexer for that source.
     * A Lexer is a stateful stream generator in that every time
     * it is advanced, it returns the next token in the Source. Assuming the
     * source lexes, the final Token emitted by the lexer will be of kind
     * EOF, after which the lexer will repeatedly return the same EOF token
     * whenever called.
     */

    function createLexer(source, options) {
      var startOfFileToken = new Tok(TokenKind.SOF, 0, 0, 0, 0, null);
      var lexer = {
        source: source,
        options: options,
        lastToken: startOfFileToken,
        token: startOfFileToken,
        line: 1,
        lineStart: 0,
        advance: advanceLexer,
        lookahead: lookahead
      };
      return lexer;
    }

    function advanceLexer() {
      this.lastToken = this.token;
      var token = this.token = this.lookahead();
      return token;
    }

    function lookahead() {
      var token = this.token;

      if (token.kind !== TokenKind.EOF) {
        do {
          // Note: next is only mutable during parsing, so we cast to allow this.
          token = token.next || (token.next = readToken(this, token));
        } while (token.kind === TokenKind.COMMENT);
      }

      return token;
    }
    /**
     * A helper function to describe a token as a string for debugging
     */

    function getTokenDesc(token) {
      var value = token.value;
      return value ? "".concat(token.kind, " \"").concat(value, "\"") : token.kind;
    }
    /**
     * Helper function for constructing the Token object.
     */

    function Tok(kind, start, end, line, column, prev, value) {
      this.kind = kind;
      this.start = start;
      this.end = end;
      this.line = line;
      this.column = column;
      this.value = value;
      this.prev = prev;
      this.next = null;
    } // Print a simplified form when appearing in JSON/util.inspect.


    defineToJSON(Tok, function () {
      return {
        kind: this.kind,
        value: this.value,
        line: this.line,
        column: this.column
      };
    });

    function printCharCode(code) {
      return (// NaN/undefined represents access beyond the end of the file.
        isNaN(code) ? TokenKind.EOF : // Trust JSON for ASCII.
        code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
        "\"\\u".concat(('00' + code.toString(16).toUpperCase()).slice(-4), "\"")
      );
    }
    /**
     * Gets the next token from the source starting at the given position.
     *
     * This skips over whitespace until it finds the next lexable token, then lexes
     * punctuators immediately or calls the appropriate helper function for more
     * complicated tokens.
     */


    function readToken(lexer, prev) {
      var source = lexer.source;
      var body = source.body;
      var bodyLength = body.length;
      var pos = positionAfterWhitespace(body, prev.end, lexer);
      var line = lexer.line;
      var col = 1 + pos - lexer.lineStart;

      if (pos >= bodyLength) {
        return new Tok(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
      }

      var code = body.charCodeAt(pos); // SourceCharacter

      switch (code) {
        // !
        case 33:
          return new Tok(TokenKind.BANG, pos, pos + 1, line, col, prev);
        // #

        case 35:
          return readComment(source, pos, line, col, prev);
        // $

        case 36:
          return new Tok(TokenKind.DOLLAR, pos, pos + 1, line, col, prev);
        // &

        case 38:
          return new Tok(TokenKind.AMP, pos, pos + 1, line, col, prev);
        // (

        case 40:
          return new Tok(TokenKind.PAREN_L, pos, pos + 1, line, col, prev);
        // )

        case 41:
          return new Tok(TokenKind.PAREN_R, pos, pos + 1, line, col, prev);
        // .

        case 46:
          if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
            return new Tok(TokenKind.SPREAD, pos, pos + 3, line, col, prev);
          }

          break;
        // :

        case 58:
          return new Tok(TokenKind.COLON, pos, pos + 1, line, col, prev);
        // =

        case 61:
          return new Tok(TokenKind.EQUALS, pos, pos + 1, line, col, prev);
        // @

        case 64:
          return new Tok(TokenKind.AT, pos, pos + 1, line, col, prev);
        // [

        case 91:
          return new Tok(TokenKind.BRACKET_L, pos, pos + 1, line, col, prev);
        // ]

        case 93:
          return new Tok(TokenKind.BRACKET_R, pos, pos + 1, line, col, prev);
        // {

        case 123:
          return new Tok(TokenKind.BRACE_L, pos, pos + 1, line, col, prev);
        // |

        case 124:
          return new Tok(TokenKind.PIPE, pos, pos + 1, line, col, prev);
        // }

        case 125:
          return new Tok(TokenKind.BRACE_R, pos, pos + 1, line, col, prev);
        // A-Z _ a-z

        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 95:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          return readName(source, pos, line, col, prev);
        // - 0-9

        case 45:
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          return readNumber(source, pos, code, line, col, prev);
        // "

        case 34:
          if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
            return readBlockString(source, pos, line, col, prev, lexer);
          }

          return readString(source, pos, line, col, prev);
      }

      throw syntaxError(source, pos, unexpectedCharacterMessage(code));
    }
    /**
     * Report a message that an unexpected character was encountered.
     */


    function unexpectedCharacterMessage(code) {
      if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
        return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
      }

      if (code === 39) {
        // '
        return 'Unexpected single quote character (\'), did you mean to use a double quote (")?';
      }

      return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
    }
    /**
     * Reads from body starting at startPosition until it finds a non-whitespace
     * character, then returns the position of that character for lexing.
     */


    function positionAfterWhitespace(body, startPosition, lexer) {
      var bodyLength = body.length;
      var position = startPosition;

      while (position < bodyLength) {
        var code = body.charCodeAt(position); // tab | space | comma | BOM

        if (code === 9 || code === 32 || code === 44 || code === 0xfeff) {
          ++position;
        } else if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else {
          break;
        }
      }

      return position;
    }
    /**
     * Reads a comment token from the source file.
     *
     * #[\u0009\u0020-\uFFFF]*
     */


    function readComment(source, start, line, col, prev) {
      var body = source.body;
      var code;
      var position = start;

      do {
        code = body.charCodeAt(++position);
      } while (!isNaN(code) && ( // SourceCharacter but not LineTerminator
      code > 0x001f || code === 0x0009));

      return new Tok(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
    }
    /**
     * Reads a number token from the source file, either a float
     * or an int depending on whether a decimal point appears.
     *
     * Int:   -?(0|[1-9][0-9]*)
     * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
     */


    function readNumber(source, start, firstCode, line, col, prev) {
      var body = source.body;
      var code = firstCode;
      var position = start;
      var isFloat = false;

      if (code === 45) {
        // -
        code = body.charCodeAt(++position);
      }

      if (code === 48) {
        // 0
        code = body.charCodeAt(++position);

        if (code >= 48 && code <= 57) {
          throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
        }
      } else {
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 46) {
        // .
        isFloat = true;
        code = body.charCodeAt(++position);
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 69 || code === 101) {
        // E e
        isFloat = true;
        code = body.charCodeAt(++position);

        if (code === 43 || code === 45) {
          // + -
          code = body.charCodeAt(++position);
        }

        position = readDigits(source, position, code);
      }

      return new Tok(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
    }
    /**
     * Returns the new position in the source after reading digits.
     */


    function readDigits(source, start, firstCode) {
      var body = source.body;
      var position = start;
      var code = firstCode;

      if (code >= 48 && code <= 57) {
        // 0 - 9
        do {
          code = body.charCodeAt(++position);
        } while (code >= 48 && code <= 57); // 0 - 9


        return position;
      }

      throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
    }
    /**
     * Reads a string token from the source file.
     *
     * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
     */


    function readString(source, start, line, col, prev) {
      var body = source.body;
      var position = start + 1;
      var chunkStart = position;
      var code = 0;
      var value = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position)) && // not LineTerminator
      code !== 0x000a && code !== 0x000d) {
        // Closing Quote (")
        if (code === 34) {
          value += body.slice(chunkStart, position);
          return new Tok(TokenKind.STRING, start, position + 1, line, col, prev, value);
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        ++position;

        if (code === 92) {
          // \
          value += body.slice(chunkStart, position - 1);
          code = body.charCodeAt(position);

          switch (code) {
            case 34:
              value += '"';
              break;

            case 47:
              value += '/';
              break;

            case 92:
              value += '\\';
              break;

            case 98:
              value += '\b';
              break;

            case 102:
              value += '\f';
              break;

            case 110:
              value += '\n';
              break;

            case 114:
              value += '\r';
              break;

            case 116:
              value += '\t';
              break;

            case 117:
              {
                // uXXXX
                var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));

                if (charCode < 0) {
                  var invalidSequence = body.slice(position + 1, position + 5);
                  throw syntaxError(source, position, "Invalid character escape sequence: \\u".concat(invalidSequence, "."));
                }

                value += String.fromCharCode(charCode);
                position += 4;
                break;
              }

            default:
              throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
          }

          ++position;
          chunkStart = position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Reads a block string token from the source file.
     *
     * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
     */


    function readBlockString(source, start, line, col, prev, lexer) {
      var body = source.body;
      var position = start + 3;
      var chunkStart = position;
      var code = 0;
      var rawValue = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
        // Closing Triple-Quote (""")
        if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
          rawValue += body.slice(chunkStart, position);
          return new Tok(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else if ( // Escape Triple-Quote (\""")
        code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
          rawValue += body.slice(chunkStart, position) + '"""';
          position += 4;
          chunkStart = position;
        } else {
          ++position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Converts four hexadecimal chars to the integer that the
     * string represents. For example, uniCharCode('0','0','0','f')
     * will return 15, and uniCharCode('0','0','f','f') returns 255.
     *
     * Returns a negative number on error, if a char was invalid.
     *
     * This is implemented by noting that char2hex() returns -1 on error,
     * which means the result of ORing the char2hex() will also be negative.
     */


    function uniCharCode(a, b, c, d) {
      return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
    }
    /**
     * Converts a hex character to its integer value.
     * '0' becomes 0, '9' becomes 9
     * 'A' becomes 10, 'F' becomes 15
     * 'a' becomes 10, 'f' becomes 15
     *
     * Returns -1 on error.
     */


    function char2hex(a) {
      return a >= 48 && a <= 57 ? a - 48 // 0-9
      : a >= 65 && a <= 70 ? a - 55 // A-F
      : a >= 97 && a <= 102 ? a - 87 // a-f
      : -1;
    }
    /**
     * Reads an alphanumeric + underscore name from the source.
     *
     * [_A-Za-z][_0-9A-Za-z]*
     */


    function readName(source, start, line, col, prev) {
      var body = source.body;
      var bodyLength = body.length;
      var position = start + 1;
      var code = 0;

      while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || // _
      code >= 48 && code <= 57 || // 0-9
      code >= 65 && code <= 90 || // A-Z
      code >= 97 && code <= 122) // a-z
      ) {
        ++position;
      }

      return new Tok(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
    }

    /**
     * The set of allowed kind values for AST nodes.
     */
    var Kind = Object.freeze({
      // Name
      NAME: 'Name',
      // Document
      DOCUMENT: 'Document',
      OPERATION_DEFINITION: 'OperationDefinition',
      VARIABLE_DEFINITION: 'VariableDefinition',
      SELECTION_SET: 'SelectionSet',
      FIELD: 'Field',
      ARGUMENT: 'Argument',
      // Fragments
      FRAGMENT_SPREAD: 'FragmentSpread',
      INLINE_FRAGMENT: 'InlineFragment',
      FRAGMENT_DEFINITION: 'FragmentDefinition',
      // Values
      VARIABLE: 'Variable',
      INT: 'IntValue',
      FLOAT: 'FloatValue',
      STRING: 'StringValue',
      BOOLEAN: 'BooleanValue',
      NULL: 'NullValue',
      ENUM: 'EnumValue',
      LIST: 'ListValue',
      OBJECT: 'ObjectValue',
      OBJECT_FIELD: 'ObjectField',
      // Directives
      DIRECTIVE: 'Directive',
      // Types
      NAMED_TYPE: 'NamedType',
      LIST_TYPE: 'ListType',
      NON_NULL_TYPE: 'NonNullType',
      // Type System Definitions
      SCHEMA_DEFINITION: 'SchemaDefinition',
      OPERATION_TYPE_DEFINITION: 'OperationTypeDefinition',
      // Type Definitions
      SCALAR_TYPE_DEFINITION: 'ScalarTypeDefinition',
      OBJECT_TYPE_DEFINITION: 'ObjectTypeDefinition',
      FIELD_DEFINITION: 'FieldDefinition',
      INPUT_VALUE_DEFINITION: 'InputValueDefinition',
      INTERFACE_TYPE_DEFINITION: 'InterfaceTypeDefinition',
      UNION_TYPE_DEFINITION: 'UnionTypeDefinition',
      ENUM_TYPE_DEFINITION: 'EnumTypeDefinition',
      ENUM_VALUE_DEFINITION: 'EnumValueDefinition',
      INPUT_OBJECT_TYPE_DEFINITION: 'InputObjectTypeDefinition',
      // Directive Definitions
      DIRECTIVE_DEFINITION: 'DirectiveDefinition',
      // Type System Extensions
      SCHEMA_EXTENSION: 'SchemaExtension',
      // Type Extensions
      SCALAR_TYPE_EXTENSION: 'ScalarTypeExtension',
      OBJECT_TYPE_EXTENSION: 'ObjectTypeExtension',
      INTERFACE_TYPE_EXTENSION: 'InterfaceTypeExtension',
      UNION_TYPE_EXTENSION: 'UnionTypeExtension',
      ENUM_TYPE_EXTENSION: 'EnumTypeExtension',
      INPUT_OBJECT_TYPE_EXTENSION: 'InputObjectTypeExtension'
    });
    /**
     * The enum type representing the possible kind values of AST nodes.
     */

    /**
     * The set of allowed directive location values.
     */
    var DirectiveLocation = Object.freeze({
      // Request Definitions
      QUERY: 'QUERY',
      MUTATION: 'MUTATION',
      SUBSCRIPTION: 'SUBSCRIPTION',
      FIELD: 'FIELD',
      FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
      FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
      INLINE_FRAGMENT: 'INLINE_FRAGMENT',
      VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
      // Type System Definitions
      SCHEMA: 'SCHEMA',
      SCALAR: 'SCALAR',
      OBJECT: 'OBJECT',
      FIELD_DEFINITION: 'FIELD_DEFINITION',
      ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
      INTERFACE: 'INTERFACE',
      UNION: 'UNION',
      ENUM: 'ENUM',
      ENUM_VALUE: 'ENUM_VALUE',
      INPUT_OBJECT: 'INPUT_OBJECT',
      INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
    });
    /**
     * The enum type representing the directive location values.
     */

    /**
     * Configuration options to control parser behavior
     */

    /**
     * Given a GraphQL source, parses it into a Document.
     * Throws GraphQLError if a syntax error is encountered.
     */
    function parse(source, options) {
      var sourceObj = typeof source === 'string' ? new Source(source) : source;

      if (!(sourceObj instanceof Source)) {
        throw new TypeError("Must provide Source. Received: ".concat(inspect(sourceObj)));
      }

      var lexer = createLexer(sourceObj, options || {});
      return parseDocument(lexer);
    }
    /**
     * Given a string containing a GraphQL value (ex. `[42]`), parse the AST for
     * that value.
     * Throws GraphQLError if a syntax error is encountered.
     *
     * This is useful within tools that operate upon GraphQL Values directly and
     * in isolation of complete GraphQL documents.
     *
     * Consider providing the results to the utility function: valueFromAST().
     */

    function parseValue(source, options) {
      var sourceObj = typeof source === 'string' ? new Source(source) : source;
      var lexer = createLexer(sourceObj, options || {});
      expectToken(lexer, TokenKind.SOF);
      var value = parseValueLiteral(lexer, false);
      expectToken(lexer, TokenKind.EOF);
      return value;
    }
    /**
     * Given a string containing a GraphQL Type (ex. `[Int!]`), parse the AST for
     * that type.
     * Throws GraphQLError if a syntax error is encountered.
     *
     * This is useful within tools that operate upon GraphQL Types directly and
     * in isolation of complete GraphQL documents.
     *
     * Consider providing the results to the utility function: typeFromAST().
     */

    function parseType(source, options) {
      var sourceObj = typeof source === 'string' ? new Source(source) : source;
      var lexer = createLexer(sourceObj, options || {});
      expectToken(lexer, TokenKind.SOF);
      var type = parseTypeReference(lexer);
      expectToken(lexer, TokenKind.EOF);
      return type;
    }
    /**
     * Converts a name lex token into a name parse node.
     */

    function parseName(lexer) {
      var token = expectToken(lexer, TokenKind.NAME);
      return {
        kind: Kind.NAME,
        value: token.value,
        loc: loc$1(lexer, token)
      };
    } // Implements the parsing rules in the Document section.

    /**
     * Document : Definition+
     */


    function parseDocument(lexer) {
      var start = lexer.token;
      return {
        kind: Kind.DOCUMENT,
        definitions: many(lexer, TokenKind.SOF, parseDefinition, TokenKind.EOF),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * Definition :
     *   - ExecutableDefinition
     *   - TypeSystemDefinition
     *   - TypeSystemExtension
     */


    function parseDefinition(lexer) {
      if (peek(lexer, TokenKind.NAME)) {
        switch (lexer.token.value) {
          case 'query':
          case 'mutation':
          case 'subscription':
          case 'fragment':
            return parseExecutableDefinition(lexer);

          case 'schema':
          case 'scalar':
          case 'type':
          case 'interface':
          case 'union':
          case 'enum':
          case 'input':
          case 'directive':
            return parseTypeSystemDefinition(lexer);

          case 'extend':
            return parseTypeSystemExtension(lexer);
        }
      } else if (peek(lexer, TokenKind.BRACE_L)) {
        return parseExecutableDefinition(lexer);
      } else if (peekDescription(lexer)) {
        return parseTypeSystemDefinition(lexer);
      }

      throw unexpected(lexer);
    }
    /**
     * ExecutableDefinition :
     *   - OperationDefinition
     *   - FragmentDefinition
     */


    function parseExecutableDefinition(lexer) {
      if (peek(lexer, TokenKind.NAME)) {
        switch (lexer.token.value) {
          case 'query':
          case 'mutation':
          case 'subscription':
            return parseOperationDefinition(lexer);

          case 'fragment':
            return parseFragmentDefinition(lexer);
        }
      } else if (peek(lexer, TokenKind.BRACE_L)) {
        return parseOperationDefinition(lexer);
      }

      throw unexpected(lexer);
    } // Implements the parsing rules in the Operations section.

    /**
     * OperationDefinition :
     *  - SelectionSet
     *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
     */


    function parseOperationDefinition(lexer) {
      var start = lexer.token;

      if (peek(lexer, TokenKind.BRACE_L)) {
        return {
          kind: Kind.OPERATION_DEFINITION,
          operation: 'query',
          name: undefined,
          variableDefinitions: [],
          directives: [],
          selectionSet: parseSelectionSet(lexer),
          loc: loc$1(lexer, start)
        };
      }

      var operation = parseOperationType(lexer);
      var name;

      if (peek(lexer, TokenKind.NAME)) {
        name = parseName(lexer);
      }

      return {
        kind: Kind.OPERATION_DEFINITION,
        operation: operation,
        name: name,
        variableDefinitions: parseVariableDefinitions(lexer),
        directives: parseDirectives(lexer, false),
        selectionSet: parseSelectionSet(lexer),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * OperationType : one of query mutation subscription
     */


    function parseOperationType(lexer) {
      var operationToken = expectToken(lexer, TokenKind.NAME);

      switch (operationToken.value) {
        case 'query':
          return 'query';

        case 'mutation':
          return 'mutation';

        case 'subscription':
          return 'subscription';
      }

      throw unexpected(lexer, operationToken);
    }
    /**
     * VariableDefinitions : ( VariableDefinition+ )
     */


    function parseVariableDefinitions(lexer) {
      return peek(lexer, TokenKind.PAREN_L) ? many(lexer, TokenKind.PAREN_L, parseVariableDefinition, TokenKind.PAREN_R) : [];
    }
    /**
     * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
     */


    function parseVariableDefinition(lexer) {
      var start = lexer.token;
      return {
        kind: Kind.VARIABLE_DEFINITION,
        variable: parseVariable(lexer),
        type: (expectToken(lexer, TokenKind.COLON), parseTypeReference(lexer)),
        defaultValue: expectOptionalToken(lexer, TokenKind.EQUALS) ? parseValueLiteral(lexer, true) : undefined,
        directives: parseDirectives(lexer, true),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * Variable : $ Name
     */


    function parseVariable(lexer) {
      var start = lexer.token;
      expectToken(lexer, TokenKind.DOLLAR);
      return {
        kind: Kind.VARIABLE,
        name: parseName(lexer),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * SelectionSet : { Selection+ }
     */


    function parseSelectionSet(lexer) {
      var start = lexer.token;
      return {
        kind: Kind.SELECTION_SET,
        selections: many(lexer, TokenKind.BRACE_L, parseSelection, TokenKind.BRACE_R),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * Selection :
     *   - Field
     *   - FragmentSpread
     *   - InlineFragment
     */


    function parseSelection(lexer) {
      return peek(lexer, TokenKind.SPREAD) ? parseFragment(lexer) : parseField(lexer);
    }
    /**
     * Field : Alias? Name Arguments? Directives? SelectionSet?
     *
     * Alias : Name :
     */


    function parseField(lexer) {
      var start = lexer.token;
      var nameOrAlias = parseName(lexer);
      var alias;
      var name;

      if (expectOptionalToken(lexer, TokenKind.COLON)) {
        alias = nameOrAlias;
        name = parseName(lexer);
      } else {
        name = nameOrAlias;
      }

      return {
        kind: Kind.FIELD,
        alias: alias,
        name: name,
        arguments: parseArguments(lexer, false),
        directives: parseDirectives(lexer, false),
        selectionSet: peek(lexer, TokenKind.BRACE_L) ? parseSelectionSet(lexer) : undefined,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * Arguments[Const] : ( Argument[?Const]+ )
     */


    function parseArguments(lexer, isConst) {
      var item = isConst ? parseConstArgument : parseArgument;
      return peek(lexer, TokenKind.PAREN_L) ? many(lexer, TokenKind.PAREN_L, item, TokenKind.PAREN_R) : [];
    }
    /**
     * Argument[Const] : Name : Value[?Const]
     */


    function parseArgument(lexer) {
      var start = lexer.token;
      var name = parseName(lexer);
      expectToken(lexer, TokenKind.COLON);
      return {
        kind: Kind.ARGUMENT,
        name: name,
        value: parseValueLiteral(lexer, false),
        loc: loc$1(lexer, start)
      };
    }

    function parseConstArgument(lexer) {
      var start = lexer.token;
      return {
        kind: Kind.ARGUMENT,
        name: parseName(lexer),
        value: (expectToken(lexer, TokenKind.COLON), parseConstValue(lexer)),
        loc: loc$1(lexer, start)
      };
    } // Implements the parsing rules in the Fragments section.

    /**
     * Corresponds to both FragmentSpread and InlineFragment in the spec.
     *
     * FragmentSpread : ... FragmentName Directives?
     *
     * InlineFragment : ... TypeCondition? Directives? SelectionSet
     */


    function parseFragment(lexer) {
      var start = lexer.token;
      expectToken(lexer, TokenKind.SPREAD);
      var hasTypeCondition = expectOptionalKeyword(lexer, 'on');

      if (!hasTypeCondition && peek(lexer, TokenKind.NAME)) {
        return {
          kind: Kind.FRAGMENT_SPREAD,
          name: parseFragmentName(lexer),
          directives: parseDirectives(lexer, false),
          loc: loc$1(lexer, start)
        };
      }

      return {
        kind: Kind.INLINE_FRAGMENT,
        typeCondition: hasTypeCondition ? parseNamedType(lexer) : undefined,
        directives: parseDirectives(lexer, false),
        selectionSet: parseSelectionSet(lexer),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * FragmentDefinition :
     *   - fragment FragmentName on TypeCondition Directives? SelectionSet
     *
     * TypeCondition : NamedType
     */


    function parseFragmentDefinition(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'fragment'); // Experimental support for defining variables within fragments changes
      // the grammar of FragmentDefinition:
      //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet

      if (lexer.options.experimentalFragmentVariables) {
        return {
          kind: Kind.FRAGMENT_DEFINITION,
          name: parseFragmentName(lexer),
          variableDefinitions: parseVariableDefinitions(lexer),
          typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
          directives: parseDirectives(lexer, false),
          selectionSet: parseSelectionSet(lexer),
          loc: loc$1(lexer, start)
        };
      }

      return {
        kind: Kind.FRAGMENT_DEFINITION,
        name: parseFragmentName(lexer),
        typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
        directives: parseDirectives(lexer, false),
        selectionSet: parseSelectionSet(lexer),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * FragmentName : Name but not `on`
     */


    function parseFragmentName(lexer) {
      if (lexer.token.value === 'on') {
        throw unexpected(lexer);
      }

      return parseName(lexer);
    } // Implements the parsing rules in the Values section.

    /**
     * Value[Const] :
     *   - [~Const] Variable
     *   - IntValue
     *   - FloatValue
     *   - StringValue
     *   - BooleanValue
     *   - NullValue
     *   - EnumValue
     *   - ListValue[?Const]
     *   - ObjectValue[?Const]
     *
     * BooleanValue : one of `true` `false`
     *
     * NullValue : `null`
     *
     * EnumValue : Name but not `true`, `false` or `null`
     */


    function parseValueLiteral(lexer, isConst) {
      var token = lexer.token;

      switch (token.kind) {
        case TokenKind.BRACKET_L:
          return parseList(lexer, isConst);

        case TokenKind.BRACE_L:
          return parseObject(lexer, isConst);

        case TokenKind.INT:
          lexer.advance();
          return {
            kind: Kind.INT,
            value: token.value,
            loc: loc$1(lexer, token)
          };

        case TokenKind.FLOAT:
          lexer.advance();
          return {
            kind: Kind.FLOAT,
            value: token.value,
            loc: loc$1(lexer, token)
          };

        case TokenKind.STRING:
        case TokenKind.BLOCK_STRING:
          return parseStringLiteral(lexer);

        case TokenKind.NAME:
          if (token.value === 'true' || token.value === 'false') {
            lexer.advance();
            return {
              kind: Kind.BOOLEAN,
              value: token.value === 'true',
              loc: loc$1(lexer, token)
            };
          } else if (token.value === 'null') {
            lexer.advance();
            return {
              kind: Kind.NULL,
              loc: loc$1(lexer, token)
            };
          }

          lexer.advance();
          return {
            kind: Kind.ENUM,
            value: token.value,
            loc: loc$1(lexer, token)
          };

        case TokenKind.DOLLAR:
          if (!isConst) {
            return parseVariable(lexer);
          }

          break;
      }

      throw unexpected(lexer);
    }

    function parseStringLiteral(lexer) {
      var token = lexer.token;
      lexer.advance();
      return {
        kind: Kind.STRING,
        value: token.value,
        block: token.kind === TokenKind.BLOCK_STRING,
        loc: loc$1(lexer, token)
      };
    }

    function parseConstValue(lexer) {
      return parseValueLiteral(lexer, true);
    }

    function parseValueValue(lexer) {
      return parseValueLiteral(lexer, false);
    }
    /**
     * ListValue[Const] :
     *   - [ ]
     *   - [ Value[?Const]+ ]
     */


    function parseList(lexer, isConst) {
      var start = lexer.token;
      var item = isConst ? parseConstValue : parseValueValue;
      return {
        kind: Kind.LIST,
        values: any(lexer, TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ObjectValue[Const] :
     *   - { }
     *   - { ObjectField[?Const]+ }
     */


    function parseObject(lexer, isConst) {
      var start = lexer.token;

      var item = function item() {
        return parseObjectField(lexer, isConst);
      };

      return {
        kind: Kind.OBJECT,
        fields: any(lexer, TokenKind.BRACE_L, item, TokenKind.BRACE_R),
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ObjectField[Const] : Name : Value[?Const]
     */


    function parseObjectField(lexer, isConst) {
      var start = lexer.token;
      var name = parseName(lexer);
      expectToken(lexer, TokenKind.COLON);
      return {
        kind: Kind.OBJECT_FIELD,
        name: name,
        value: parseValueLiteral(lexer, isConst),
        loc: loc$1(lexer, start)
      };
    } // Implements the parsing rules in the Directives section.

    /**
     * Directives[Const] : Directive[?Const]+
     */


    function parseDirectives(lexer, isConst) {
      var directives = [];

      while (peek(lexer, TokenKind.AT)) {
        directives.push(parseDirective(lexer, isConst));
      }

      return directives;
    }
    /**
     * Directive[Const] : @ Name Arguments[?Const]?
     */


    function parseDirective(lexer, isConst) {
      var start = lexer.token;
      expectToken(lexer, TokenKind.AT);
      return {
        kind: Kind.DIRECTIVE,
        name: parseName(lexer),
        arguments: parseArguments(lexer, isConst),
        loc: loc$1(lexer, start)
      };
    } // Implements the parsing rules in the Types section.

    /**
     * Type :
     *   - NamedType
     *   - ListType
     *   - NonNullType
     */


    function parseTypeReference(lexer) {
      var start = lexer.token;
      var type;

      if (expectOptionalToken(lexer, TokenKind.BRACKET_L)) {
        type = parseTypeReference(lexer);
        expectToken(lexer, TokenKind.BRACKET_R);
        type = {
          kind: Kind.LIST_TYPE,
          type: type,
          loc: loc$1(lexer, start)
        };
      } else {
        type = parseNamedType(lexer);
      }

      if (expectOptionalToken(lexer, TokenKind.BANG)) {
        return {
          kind: Kind.NON_NULL_TYPE,
          type: type,
          loc: loc$1(lexer, start)
        };
      }

      return type;
    }
    /**
     * NamedType : Name
     */

    function parseNamedType(lexer) {
      var start = lexer.token;
      return {
        kind: Kind.NAMED_TYPE,
        name: parseName(lexer),
        loc: loc$1(lexer, start)
      };
    } // Implements the parsing rules in the Type Definition section.

    /**
     * TypeSystemDefinition :
     *   - SchemaDefinition
     *   - TypeDefinition
     *   - DirectiveDefinition
     *
     * TypeDefinition :
     *   - ScalarTypeDefinition
     *   - ObjectTypeDefinition
     *   - InterfaceTypeDefinition
     *   - UnionTypeDefinition
     *   - EnumTypeDefinition
     *   - InputObjectTypeDefinition
     */

    function parseTypeSystemDefinition(lexer) {
      // Many definitions begin with a description and require a lookahead.
      var keywordToken = peekDescription(lexer) ? lexer.lookahead() : lexer.token;

      if (keywordToken.kind === TokenKind.NAME) {
        switch (keywordToken.value) {
          case 'schema':
            return parseSchemaDefinition(lexer);

          case 'scalar':
            return parseScalarTypeDefinition(lexer);

          case 'type':
            return parseObjectTypeDefinition(lexer);

          case 'interface':
            return parseInterfaceTypeDefinition(lexer);

          case 'union':
            return parseUnionTypeDefinition(lexer);

          case 'enum':
            return parseEnumTypeDefinition(lexer);

          case 'input':
            return parseInputObjectTypeDefinition(lexer);

          case 'directive':
            return parseDirectiveDefinition(lexer);
        }
      }

      throw unexpected(lexer, keywordToken);
    }

    function peekDescription(lexer) {
      return peek(lexer, TokenKind.STRING) || peek(lexer, TokenKind.BLOCK_STRING);
    }
    /**
     * Description : StringValue
     */


    function parseDescription(lexer) {
      if (peekDescription(lexer)) {
        return parseStringLiteral(lexer);
      }
    }
    /**
     * SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
     */


    function parseSchemaDefinition(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'schema');
      var directives = parseDirectives(lexer, true);
      var operationTypes = many(lexer, TokenKind.BRACE_L, parseOperationTypeDefinition, TokenKind.BRACE_R);
      return {
        kind: Kind.SCHEMA_DEFINITION,
        directives: directives,
        operationTypes: operationTypes,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * OperationTypeDefinition : OperationType : NamedType
     */


    function parseOperationTypeDefinition(lexer) {
      var start = lexer.token;
      var operation = parseOperationType(lexer);
      expectToken(lexer, TokenKind.COLON);
      var type = parseNamedType(lexer);
      return {
        kind: Kind.OPERATION_TYPE_DEFINITION,
        operation: operation,
        type: type,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
     */


    function parseScalarTypeDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'scalar');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      return {
        kind: Kind.SCALAR_TYPE_DEFINITION,
        description: description,
        name: name,
        directives: directives,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ObjectTypeDefinition :
     *   Description?
     *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
     */


    function parseObjectTypeDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'type');
      var name = parseName(lexer);
      var interfaces = parseImplementsInterfaces(lexer);
      var directives = parseDirectives(lexer, true);
      var fields = parseFieldsDefinition(lexer);
      return {
        kind: Kind.OBJECT_TYPE_DEFINITION,
        description: description,
        name: name,
        interfaces: interfaces,
        directives: directives,
        fields: fields,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ImplementsInterfaces :
     *   - implements `&`? NamedType
     *   - ImplementsInterfaces & NamedType
     */


    function parseImplementsInterfaces(lexer) {
      var types = [];

      if (expectOptionalKeyword(lexer, 'implements')) {
        // Optional leading ampersand
        expectOptionalToken(lexer, TokenKind.AMP);

        do {
          types.push(parseNamedType(lexer));
        } while (expectOptionalToken(lexer, TokenKind.AMP) || // Legacy support for the SDL?
        lexer.options.allowLegacySDLImplementsInterfaces && peek(lexer, TokenKind.NAME));
      }

      return types;
    }
    /**
     * FieldsDefinition : { FieldDefinition+ }
     */


    function parseFieldsDefinition(lexer) {
      // Legacy support for the SDL?
      if (lexer.options.allowLegacySDLEmptyFields && peek(lexer, TokenKind.BRACE_L) && lexer.lookahead().kind === TokenKind.BRACE_R) {
        lexer.advance();
        lexer.advance();
        return [];
      }

      return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseFieldDefinition, TokenKind.BRACE_R) : [];
    }
    /**
     * FieldDefinition :
     *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
     */


    function parseFieldDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      var name = parseName(lexer);
      var args = parseArgumentDefs(lexer);
      expectToken(lexer, TokenKind.COLON);
      var type = parseTypeReference(lexer);
      var directives = parseDirectives(lexer, true);
      return {
        kind: Kind.FIELD_DEFINITION,
        description: description,
        name: name,
        arguments: args,
        type: type,
        directives: directives,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ArgumentsDefinition : ( InputValueDefinition+ )
     */


    function parseArgumentDefs(lexer) {
      if (!peek(lexer, TokenKind.PAREN_L)) {
        return [];
      }

      return many(lexer, TokenKind.PAREN_L, parseInputValueDef, TokenKind.PAREN_R);
    }
    /**
     * InputValueDefinition :
     *   - Description? Name : Type DefaultValue? Directives[Const]?
     */


    function parseInputValueDef(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      var name = parseName(lexer);
      expectToken(lexer, TokenKind.COLON);
      var type = parseTypeReference(lexer);
      var defaultValue;

      if (expectOptionalToken(lexer, TokenKind.EQUALS)) {
        defaultValue = parseConstValue(lexer);
      }

      var directives = parseDirectives(lexer, true);
      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        description: description,
        name: name,
        type: type,
        defaultValue: defaultValue,
        directives: directives,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * InterfaceTypeDefinition :
     *   - Description? interface Name Directives[Const]? FieldsDefinition?
     */


    function parseInterfaceTypeDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'interface');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var fields = parseFieldsDefinition(lexer);
      return {
        kind: Kind.INTERFACE_TYPE_DEFINITION,
        description: description,
        name: name,
        directives: directives,
        fields: fields,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * UnionTypeDefinition :
     *   - Description? union Name Directives[Const]? UnionMemberTypes?
     */


    function parseUnionTypeDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'union');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var types = parseUnionMemberTypes(lexer);
      return {
        kind: Kind.UNION_TYPE_DEFINITION,
        description: description,
        name: name,
        directives: directives,
        types: types,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * UnionMemberTypes :
     *   - = `|`? NamedType
     *   - UnionMemberTypes | NamedType
     */


    function parseUnionMemberTypes(lexer) {
      var types = [];

      if (expectOptionalToken(lexer, TokenKind.EQUALS)) {
        // Optional leading pipe
        expectOptionalToken(lexer, TokenKind.PIPE);

        do {
          types.push(parseNamedType(lexer));
        } while (expectOptionalToken(lexer, TokenKind.PIPE));
      }

      return types;
    }
    /**
     * EnumTypeDefinition :
     *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
     */


    function parseEnumTypeDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'enum');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var values = parseEnumValuesDefinition(lexer);
      return {
        kind: Kind.ENUM_TYPE_DEFINITION,
        description: description,
        name: name,
        directives: directives,
        values: values,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * EnumValuesDefinition : { EnumValueDefinition+ }
     */


    function parseEnumValuesDefinition(lexer) {
      return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseEnumValueDefinition, TokenKind.BRACE_R) : [];
    }
    /**
     * EnumValueDefinition : Description? EnumValue Directives[Const]?
     *
     * EnumValue : Name
     */


    function parseEnumValueDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      return {
        kind: Kind.ENUM_VALUE_DEFINITION,
        description: description,
        name: name,
        directives: directives,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * InputObjectTypeDefinition :
     *   - Description? input Name Directives[Const]? InputFieldsDefinition?
     */


    function parseInputObjectTypeDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'input');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var fields = parseInputFieldsDefinition(lexer);
      return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        description: description,
        name: name,
        directives: directives,
        fields: fields,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * InputFieldsDefinition : { InputValueDefinition+ }
     */


    function parseInputFieldsDefinition(lexer) {
      return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseInputValueDef, TokenKind.BRACE_R) : [];
    }
    /**
     * TypeSystemExtension :
     *   - SchemaExtension
     *   - TypeExtension
     *
     * TypeExtension :
     *   - ScalarTypeExtension
     *   - ObjectTypeExtension
     *   - InterfaceTypeExtension
     *   - UnionTypeExtension
     *   - EnumTypeExtension
     *   - InputObjectTypeDefinition
     */


    function parseTypeSystemExtension(lexer) {
      var keywordToken = lexer.lookahead();

      if (keywordToken.kind === TokenKind.NAME) {
        switch (keywordToken.value) {
          case 'schema':
            return parseSchemaExtension(lexer);

          case 'scalar':
            return parseScalarTypeExtension(lexer);

          case 'type':
            return parseObjectTypeExtension(lexer);

          case 'interface':
            return parseInterfaceTypeExtension(lexer);

          case 'union':
            return parseUnionTypeExtension(lexer);

          case 'enum':
            return parseEnumTypeExtension(lexer);

          case 'input':
            return parseInputObjectTypeExtension(lexer);
        }
      }

      throw unexpected(lexer, keywordToken);
    }
    /**
     * SchemaExtension :
     *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
     *  - extend schema Directives[Const]
     */


    function parseSchemaExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'schema');
      var directives = parseDirectives(lexer, true);
      var operationTypes = peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseOperationTypeDefinition, TokenKind.BRACE_R) : [];

      if (directives.length === 0 && operationTypes.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.SCHEMA_EXTENSION,
        directives: directives,
        operationTypes: operationTypes,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ScalarTypeExtension :
     *   - extend scalar Name Directives[Const]
     */


    function parseScalarTypeExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'scalar');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);

      if (directives.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.SCALAR_TYPE_EXTENSION,
        name: name,
        directives: directives,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * ObjectTypeExtension :
     *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
     *  - extend type Name ImplementsInterfaces? Directives[Const]
     *  - extend type Name ImplementsInterfaces
     */


    function parseObjectTypeExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'type');
      var name = parseName(lexer);
      var interfaces = parseImplementsInterfaces(lexer);
      var directives = parseDirectives(lexer, true);
      var fields = parseFieldsDefinition(lexer);

      if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.OBJECT_TYPE_EXTENSION,
        name: name,
        interfaces: interfaces,
        directives: directives,
        fields: fields,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * InterfaceTypeExtension :
     *   - extend interface Name Directives[Const]? FieldsDefinition
     *   - extend interface Name Directives[Const]
     */


    function parseInterfaceTypeExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'interface');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var fields = parseFieldsDefinition(lexer);

      if (directives.length === 0 && fields.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.INTERFACE_TYPE_EXTENSION,
        name: name,
        directives: directives,
        fields: fields,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * UnionTypeExtension :
     *   - extend union Name Directives[Const]? UnionMemberTypes
     *   - extend union Name Directives[Const]
     */


    function parseUnionTypeExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'union');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var types = parseUnionMemberTypes(lexer);

      if (directives.length === 0 && types.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.UNION_TYPE_EXTENSION,
        name: name,
        directives: directives,
        types: types,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * EnumTypeExtension :
     *   - extend enum Name Directives[Const]? EnumValuesDefinition
     *   - extend enum Name Directives[Const]
     */


    function parseEnumTypeExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'enum');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var values = parseEnumValuesDefinition(lexer);

      if (directives.length === 0 && values.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.ENUM_TYPE_EXTENSION,
        name: name,
        directives: directives,
        values: values,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * InputObjectTypeExtension :
     *   - extend input Name Directives[Const]? InputFieldsDefinition
     *   - extend input Name Directives[Const]
     */


    function parseInputObjectTypeExtension(lexer) {
      var start = lexer.token;
      expectKeyword(lexer, 'extend');
      expectKeyword(lexer, 'input');
      var name = parseName(lexer);
      var directives = parseDirectives(lexer, true);
      var fields = parseInputFieldsDefinition(lexer);

      if (directives.length === 0 && fields.length === 0) {
        throw unexpected(lexer);
      }

      return {
        kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
        name: name,
        directives: directives,
        fields: fields,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * DirectiveDefinition :
     *   - Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations
     */


    function parseDirectiveDefinition(lexer) {
      var start = lexer.token;
      var description = parseDescription(lexer);
      expectKeyword(lexer, 'directive');
      expectToken(lexer, TokenKind.AT);
      var name = parseName(lexer);
      var args = parseArgumentDefs(lexer);
      var repeatable = expectOptionalKeyword(lexer, 'repeatable');
      expectKeyword(lexer, 'on');
      var locations = parseDirectiveLocations(lexer);
      return {
        kind: Kind.DIRECTIVE_DEFINITION,
        description: description,
        name: name,
        arguments: args,
        repeatable: repeatable,
        locations: locations,
        loc: loc$1(lexer, start)
      };
    }
    /**
     * DirectiveLocations :
     *   - `|`? DirectiveLocation
     *   - DirectiveLocations | DirectiveLocation
     */


    function parseDirectiveLocations(lexer) {
      // Optional leading pipe
      expectOptionalToken(lexer, TokenKind.PIPE);
      var locations = [];

      do {
        locations.push(parseDirectiveLocation(lexer));
      } while (expectOptionalToken(lexer, TokenKind.PIPE));

      return locations;
    }
    /*
     * DirectiveLocation :
     *   - ExecutableDirectiveLocation
     *   - TypeSystemDirectiveLocation
     *
     * ExecutableDirectiveLocation : one of
     *   `QUERY`
     *   `MUTATION`
     *   `SUBSCRIPTION`
     *   `FIELD`
     *   `FRAGMENT_DEFINITION`
     *   `FRAGMENT_SPREAD`
     *   `INLINE_FRAGMENT`
     *
     * TypeSystemDirectiveLocation : one of
     *   `SCHEMA`
     *   `SCALAR`
     *   `OBJECT`
     *   `FIELD_DEFINITION`
     *   `ARGUMENT_DEFINITION`
     *   `INTERFACE`
     *   `UNION`
     *   `ENUM`
     *   `ENUM_VALUE`
     *   `INPUT_OBJECT`
     *   `INPUT_FIELD_DEFINITION`
     */


    function parseDirectiveLocation(lexer) {
      var start = lexer.token;
      var name = parseName(lexer);

      if (DirectiveLocation[name.value] !== undefined) {
        return name;
      }

      throw unexpected(lexer, start);
    } // Core parsing utility functions

    /**
     * Returns a location object, used to identify the place in
     * the source that created a given parsed object.
     */


    function loc$1(lexer, startToken) {
      if (!lexer.options.noLocation) {
        return new Loc(startToken, lexer.lastToken, lexer.source);
      }
    }

    function Loc(startToken, endToken, source) {
      this.start = startToken.start;
      this.end = endToken.end;
      this.startToken = startToken;
      this.endToken = endToken;
      this.source = source;
    } // Print a simplified form when appearing in JSON/util.inspect.


    defineToJSON(Loc, function () {
      return {
        start: this.start,
        end: this.end
      };
    });
    /**
     * Determines if the next token is of a given kind
     */

    function peek(lexer, kind) {
      return lexer.token.kind === kind;
    }
    /**
     * If the next token is of the given kind, return that token after advancing
     * the lexer. Otherwise, do not change the parser state and throw an error.
     */


    function expectToken(lexer, kind) {
      var token = lexer.token;

      if (token.kind === kind) {
        lexer.advance();
        return token;
      }

      throw syntaxError(lexer.source, token.start, "Expected ".concat(kind, ", found ").concat(getTokenDesc(token)));
    }
    /**
     * If the next token is of the given kind, return that token after advancing
     * the lexer. Otherwise, do not change the parser state and return undefined.
     */


    function expectOptionalToken(lexer, kind) {
      var token = lexer.token;

      if (token.kind === kind) {
        lexer.advance();
        return token;
      }

      return undefined;
    }
    /**
     * If the next token is a given keyword, advance the lexer.
     * Otherwise, do not change the parser state and throw an error.
     */


    function expectKeyword(lexer, value) {
      var token = lexer.token;

      if (token.kind === TokenKind.NAME && token.value === value) {
        lexer.advance();
      } else {
        throw syntaxError(lexer.source, token.start, "Expected \"".concat(value, "\", found ").concat(getTokenDesc(token)));
      }
    }
    /**
     * If the next token is a given keyword, return "true" after advancing
     * the lexer. Otherwise, do not change the parser state and return "false".
     */


    function expectOptionalKeyword(lexer, value) {
      var token = lexer.token;

      if (token.kind === TokenKind.NAME && token.value === value) {
        lexer.advance();
        return true;
      }

      return false;
    }
    /**
     * Helper function for creating an error when an unexpected lexed token
     * is encountered.
     */


    function unexpected(lexer, atToken) {
      var token = atToken || lexer.token;
      return syntaxError(lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token)));
    }
    /**
     * Returns a possibly empty list of parse nodes, determined by
     * the parseFn. This list begins with a lex token of openKind
     * and ends with a lex token of closeKind. Advances the parser
     * to the next lex token after the closing token.
     */


    function any(lexer, openKind, parseFn, closeKind) {
      expectToken(lexer, openKind);
      var nodes = [];

      while (!expectOptionalToken(lexer, closeKind)) {
        nodes.push(parseFn(lexer));
      }

      return nodes;
    }
    /**
     * Returns a non-empty list of parse nodes, determined by
     * the parseFn. This list begins with a lex token of openKind
     * and ends with a lex token of closeKind. Advances the parser
     * to the next lex token after the closing token.
     */


    function many(lexer, openKind, parseFn, closeKind) {
      expectToken(lexer, openKind);
      var nodes = [parseFn(lexer)];

      while (!expectOptionalToken(lexer, closeKind)) {
        nodes.push(parseFn(lexer));
      }

      return nodes;
    }

    var parser = /*#__PURE__*/Object.freeze({
        parse: parse,
        parseValue: parseValue,
        parseType: parseType,
        parseConstValue: parseConstValue,
        parseTypeReference: parseTypeReference,
        parseNamedType: parseNamedType
    });

    var parser$1 = getCjsExportFromNamespace(parser);

    var parse$1 = parser$1.parse;

    // Strip insignificant whitespace
    // Note that this could do a lot more, such as reorder fields etc.
    function normalize(string) {
      return string.replace(/[\s,]+/g, ' ').trim();
    }

    // A map docString -> graphql document
    var docCache = {};

    // A map fragmentName -> [normalized source]
    var fragmentSourceMap = {};

    function cacheKeyFromLoc(loc) {
      return normalize(loc.source.body.substring(loc.start, loc.end));
    }

    // For testing.
    function resetCaches() {
      docCache = {};
      fragmentSourceMap = {};
    }

    // Take a unstripped parsed document (query/mutation or even fragment), and
    // check all fragment definitions, checking for name->source uniqueness.
    // We also want to make sure only unique fragments exist in the document.
    var printFragmentWarnings = true;
    function processFragments(ast) {
      var astFragmentMap = {};
      var definitions = [];

      for (var i = 0; i < ast.definitions.length; i++) {
        var fragmentDefinition = ast.definitions[i];

        if (fragmentDefinition.kind === 'FragmentDefinition') {
          var fragmentName = fragmentDefinition.name.value;
          var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);

          // We know something about this fragment
          if (fragmentSourceMap.hasOwnProperty(fragmentName) && !fragmentSourceMap[fragmentName][sourceKey]) {

            // this is a problem because the app developer is trying to register another fragment with
            // the same name as one previously registered. So, we tell them about it.
            if (printFragmentWarnings) {
              console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
                + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
                + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
            }

            fragmentSourceMap[fragmentName][sourceKey] = true;

          } else if (!fragmentSourceMap.hasOwnProperty(fragmentName)) {
            fragmentSourceMap[fragmentName] = {};
            fragmentSourceMap[fragmentName][sourceKey] = true;
          }

          if (!astFragmentMap[sourceKey]) {
            astFragmentMap[sourceKey] = true;
            definitions.push(fragmentDefinition);
          }
        } else {
          definitions.push(fragmentDefinition);
        }
      }

      ast.definitions = definitions;
      return ast;
    }

    function disableFragmentWarnings() {
      printFragmentWarnings = false;
    }

    function stripLoc(doc, removeLocAtThisLevel) {
      var docType = Object.prototype.toString.call(doc);

      if (docType === '[object Array]') {
        return doc.map(function (d) {
          return stripLoc(d, removeLocAtThisLevel);
        });
      }

      if (docType !== '[object Object]') {
        throw new Error('Unexpected input.');
      }

      // We don't want to remove the root loc field so we can use it
      // for fragment substitution (see below)
      if (removeLocAtThisLevel && doc.loc) {
        delete doc.loc;
      }

      // https://github.com/apollographql/graphql-tag/issues/40
      if (doc.loc) {
        delete doc.loc.startToken;
        delete doc.loc.endToken;
      }

      var keys = Object.keys(doc);
      var key;
      var value;
      var valueType;

      for (key in keys) {
        if (keys.hasOwnProperty(key)) {
          value = doc[keys[key]];
          valueType = Object.prototype.toString.call(value);

          if (valueType === '[object Object]' || valueType === '[object Array]') {
            doc[keys[key]] = stripLoc(value, true);
          }
        }
      }

      return doc;
    }

    var experimentalFragmentVariables = false;
    function parseDocument$1(doc) {
      var cacheKey = normalize(doc);

      if (docCache[cacheKey]) {
        return docCache[cacheKey];
      }

      var parsed = parse$1(doc, { experimentalFragmentVariables: experimentalFragmentVariables });
      if (!parsed || parsed.kind !== 'Document') {
        throw new Error('Not a valid GraphQL document.');
      }

      // check that all "new" fragments inside the documents are consistent with
      // existing fragments of the same name
      parsed = processFragments(parsed);
      parsed = stripLoc(parsed, false);
      docCache[cacheKey] = parsed;

      return parsed;
    }

    function enableExperimentalFragmentVariables() {
      experimentalFragmentVariables = true;
    }

    function disableExperimentalFragmentVariables() {
      experimentalFragmentVariables = false;
    }

    // XXX This should eventually disallow arbitrary string interpolation, like Relay does
    function gql(/* arguments */) {
      var args = Array.prototype.slice.call(arguments);

      var literals = args[0];

      // We always get literals[0] and then matching post literals for each arg given
      var result = (typeof(literals) === "string") ? literals : literals[0];

      for (var i = 1; i < args.length; i++) {
        if (args[i] && args[i].kind && args[i].kind === 'Document') {
          result += args[i].loc.source.body;
        } else {
          result += args[i];
        }

        result += literals[i];
      }

      return parseDocument$1(result);
    }

    // Support typescript, which isn't as nice as Babel about default exports
    gql.default = gql;
    gql.resetCaches = resetCaches;
    gql.disableFragmentWarnings = disableFragmentWarnings;
    gql.enableExperimentalFragmentVariables = enableExperimentalFragmentVariables;
    gql.disableExperimentalFragmentVariables = disableExperimentalFragmentVariables;

    var src = gql;

    const CREATE_USER = src`
	mutation(
		$isCompany: Boolean!
		$name: String!
		$email: String!
		$password: String!
	) {
		createUser(
			isCompany: $isCompany
			name: $name
			email: $email
			password: $password
		) {
			user {
				id
				username
				isActive
			}
		}
	}
`;

    const ACTIVATE_USER = src`
	mutation($email: String!, $code: String!) {
		activateUser(email: $email, code: $code) {
			activated
		}
	}
`;

    const LOGIN_USER = src`
	mutation($email: String!, $password: String!) {
		tokenAuth(email: $email, password: $password) {
			token
			refreshToken
		}
	}
`;

    const GET_USER = src`
	{
		me {
			id
			dateJoined
			email
			isCompany
		}
	}
`;

    const CHECK_LOGIN = src`
	{
		checkLogin
	}
`;

    const REFRESH_TOKEN = src`
	mutation($refreshToken: String!) {
		refreshToken(refreshToken: $refreshToken) {
			token
			refreshToken
			payload
		}
	}
`;

    const SEND_INVITATION = src`
	mutation($employeeEmail: String!) {
		createUserConnection(employeeEmail: $employeeEmail) {
			userConnection {
				id
				employeeEmail
				company {
					id
					email
				}
				isConfirmed
				isDeclined
			}
		}
	}
`;

    const GET_INVITATIONS = src`
	query {
		invitations {
			id
			created
			isDeclined
			isConfirmed
			employeeEmail
			company {
				id
				userprofile {
					id
					companyName
				}
			}
		}
	}
`;

    const CONFIRM_INVITATION = src`
	mutation($invitationId: ID!) {
		confirmUserConnection(userConnectionId: $invitationId) {
			userConnection {
				id
				isConfirmed
				employeeEmail
				company {
					userprofile {
						companyName
					}
				}
				created
			}
		}
	}
`;

    const GET_CONNECTIONS = src`
	query {
		connections {
			id
			created
			company {
				id
				userprofile {
					companyName
				}
			}
			employee {
				id
				userprofile {
					firstName
					lastName
				}
			}
		}
	}
`;

    const GET_SHIFTS = src`
	query($companyId: ID!) {
		shifts(companyId: $companyId) {
			id
			fromTime
			toTime
			note
			isSponsored
			postedBy {
				id
				email
				userprofile {
					firstName
					lastName
				}
			}
			postedTo {
				id
				email
				userprofile {
					companyName
				}
			}
		}
	}
`;

    const POST_SHIFT = src`
	mutation(
		$fromTime: DateTime!
		$toTime: DateTime!
		$note: String!
		$isSponsored: Boolean!
		$companyId: ID!
	) {
		createShift(
			fromTime: $fromTime
			toTime: $toTime
			note: $note
			isSponsored: $isSponsored
			companyId: $companyId
		) {
			shift {
				id
				fromTime
				toTime
				postedBy {
					email
					userprofile {
						firstName
						lastName
					}
				}
				postedTo {
					email
					userprofile {
						companyName
					}
				}
				note
				isSponsored
				created
			}
		}
	}
`;

    const PROPOSE_SHIFT = src`
	mutation($proposedShiftId: ID!, $shiftId: ID!) {
		createShiftConnection(
			proposedShiftId: $proposedShiftId
			shiftId: $shiftId
		) {
			shiftConnection {
				id
				created
				isAccepted
				shift {
					id
					fromTime
					toTime
					isSponsored
					postedBy {
						id
						email
						userprofile {
							firstName
							lastName
						}
					}
				}
				proposedShift {
					id
					fromTime
					toTime
					isSponsored
					postedBy {
						id
						email
						userprofile {
							firstName
							lastName
						}
					}
				}
			}
		}
	}
`;

    /* src\Notification.svelte generated by Svelte v3.6.7 */

    const file$1 = "src\\Notification.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.toast = list[i];
    	return child_ctx;
    }

    // (165:2) {#each toasts as toast (toast.id)}
    function create_each_block(key_1, ctx) {
    	var li, div0, t0_value = ctx.toast.msg, t0, t1, div1, t2, li_outro, current, dispose;

    	function animationend_handler() {
    		return ctx.animationend_handler(ctx);
    	}

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr(div0, "class", "content");
    			add_location(div0, file$1, 166, 6, 3586);
    			attr(div1, "class", "progress");
    			set_style(div1, "animation-duration", "" + ctx.toast.timeout + "ms");
    			add_location(div1, file$1, 167, 6, 3632);
    			attr(li, "class", "toast");
    			set_style(li, "background", ctx.toast.background);
    			add_location(li, file$1, 165, 4, 3505);
    			dispose = listen(div1, "animationend", animationend_handler);
    			this.first = li;
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, div0);
    			append(div0, t0);
    			append(li, t1);
    			append(li, div1);
    			append(li, t2);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((!current || changed.toasts) && t0_value !== (t0_value = ctx.toast.msg)) {
    				set_data(t0, t0_value);
    			}

    			if (!current || changed.toasts) {
    				set_style(div1, "animation-duration", "" + ctx.toast.timeout + "ms");
    				set_style(li, "background", ctx.toast.background);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (li_outro) li_outro.end(1);

    			current = true;
    		},

    		o: function outro(local) {
    			li_outro = create_out_transition(li, animateOut, {});

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    				if (li_outro) li_outro.end();
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var ul, each_blocks = [], each_1_lookup = new Map(), current;

    	var each_value = ctx.toasts;

    	const get_key = ctx => ctx.toast.id;

    	for (var i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
    			attr(ul, "class", "toasts");
    			add_location(ul, file$1, 163, 0, 3442);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(ul, null);

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			const each_value = ctx.toasts;

    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block, null, get_each_context);
    			check_outros();
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			for (i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
    		}
    	};
    }

    function animateOut(node, { delay = 0, duration = 300 }) {

      return {
        delay,
        duration,
        css: t =>
          `opacity: ${(t - 0.5) *
        1}; transform-origin: top right; transform: scaleX(${(t - 0.5) * 1});`
      };
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let count = 0;
      let toasts = [];
      let themes = {
        danger: "#bb2124",
        success: "#22bb33",
        warning: "#f0ad4e",
        info: "#5bc0de",
        default: "#aaaaaa"
      };
      function createToast(msg, theme, timeout) {
        const background = themes[theme] || themes["default"];
        $$invalidate('toasts', toasts = [
          {
            id: count,
            msg,
            background,
            timeout,
            width: "100%"
          },
          ...toasts
        ]);
        count = count + 1;
      }

      function removeToast(id) {
        $$invalidate('toasts', toasts = toasts.filter(t => t.id != id));
      }

      function show(msg, timeout = 3000, theme = "default") {
        createToast(msg, theme, timeout);
      }

      function danger(msg, timeout) {
        show(msg, timeout, "danger");
      }

      function warning(msg, timeout) {
        show(msg, timeout, "warning");
      }

      function info(msg, timeout) {
        show(msg, timeout, "info");
      }

      function success(msg, timeout) {
        show(msg, timeout, "success");
      }

    	function animationend_handler({ toast }) {
    		return removeToast(toast.id);
    	}

    	return {
    		toasts,
    		removeToast,
    		show,
    		danger,
    		warning,
    		info,
    		success,
    		animationend_handler
    	};
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["removeToast", "show", "danger", "warning", "info", "success"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.removeToast === undefined && !('removeToast' in props)) {
    			console.warn("<Notification> was created without expected prop 'removeToast'");
    		}
    		if (ctx.show === undefined && !('show' in props)) {
    			console.warn("<Notification> was created without expected prop 'show'");
    		}
    		if (ctx.danger === undefined && !('danger' in props)) {
    			console.warn("<Notification> was created without expected prop 'danger'");
    		}
    		if (ctx.warning === undefined && !('warning' in props)) {
    			console.warn("<Notification> was created without expected prop 'warning'");
    		}
    		if (ctx.info === undefined && !('info' in props)) {
    			console.warn("<Notification> was created without expected prop 'info'");
    		}
    		if (ctx.success === undefined && !('success' in props)) {
    			console.warn("<Notification> was created without expected prop 'success'");
    		}
    	}

    	get removeToast() {
    		return this.$$.ctx.removeToast;
    	}

    	set removeToast(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		return this.$$.ctx.show;
    	}

    	set show(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get danger() {
    		return this.$$.ctx.danger;
    	}

    	set danger(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get warning() {
    		return this.$$.ctx.warning;
    	}

    	set warning(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get info() {
    		return this.$$.ctx.info;
    	}

    	set info(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get success() {
    		return this.$$.ctx.success;
    	}

    	set success(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Noto.svelte generated by Svelte v3.6.7 */

    function create_fragment$4(ctx) {
    	var current;

    	let notification_props = {};
    	var notification = new Notification({
    		props: notification_props,
    		$$inline: true
    	});

    	ctx.notification_binding(notification);

    	return {
    		c: function create() {
    			notification.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var notification_changes = {};
    			notification.$set(notification_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			ctx.notification_binding(null);

    			destroy_component(notification, detaching);
    		}
    	};
    }

    let notifications;

    function instance$3($$self, $$props, $$invalidate) {
    	function notification_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('notifications', notifications = $$value);
    		});
    	}

    	return { notification_binding };
    }

    class Noto extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, []);
    	}
    }

    let tokenRefreshTimeout;

    async function tokenRefresh(client, oldToken) {
    	try {
    		await mutate(client, {
    			mutation: REFRESH_TOKEN,
    			variables: { refreshToken: oldToken }
    		}).then(result => {
    			const newToken = result.data.refreshToken.refreshToken;
    			refreshToken.set(newToken);
    			lastLoggedIn.set(Date.now());
    			isLoggedIn.set(true);
    			tokenRefreshTimeoutFunc(client);
    			// push("/dashboard/");
    		});
    	} catch (error) {
    		console.log(error);
    		isLoggedIn.set(false);
    	}
    }

    async function tokenRefreshTimeoutFunc(client) {
    	if (localStorage.getItem('startedTimeout') === null) {
    		localStorage.setItem('startedTimeout', JSON.stringify(false));
    	}

    	if (sessionStorage.getItem('startedTimeoutSession') === null) {
    		sessionStorage.setItem('startedTimeoutSession', JSON.stringify(false));
    	}

    	const isStartedTimeout = JSON.parse(localStorage.getItem('startedTimeout'));
    	const isSessionTimeout = JSON.parse(
    		sessionStorage.getItem('startedTimeoutSession')
    	);

    	if (isStartedTimeout === true && isSessionTimeout === false) {
    		return console.log('Already started Timeout, exiting function!!!');
    	}

    	const REFRESH_EXPIRATION_TIME_IN_MINUTES = 60;

    	let prevLoggedInDate = JSON.parse(localStorage.getItem('lastLoggedIn'));
    	let oldToken = JSON.parse(localStorage.getItem('refreshToken'));

    	// Must convert timeDifference to minutes
    	let timeDifference = Math.abs(Date.now() - prevLoggedInDate) / 60000;
    	// Must subtract 10% from the constant refresh expiration time
    	let refreshExpirationTime =
    		REFRESH_EXPIRATION_TIME_IN_MINUTES -
    		REFRESH_EXPIRATION_TIME_IN_MINUTES * 0.1;

    	if (timeDifference > refreshExpirationTime) {
    		//console.log(timeDifference + " > " + refreshExpirationTime);
    		await tokenRefresh(client, oldToken);
    	} else {
    		//console.log(timeDifference + " < " + refreshExpirationTime);
    		let remainingTime = refreshExpirationTime - timeDifference;
    		clearTokenRefreshTimeout();
    		tokenRefreshTimeout = setTimeout(
    			tokenRefresh,
    			// Must convert minutes to milliseconds
    			remainingTime * 60000,
    			client,
    			oldToken
    		);

    		if (isStartedTimeout === false) {
    			localStorage.setItem('startedTimeout', JSON.stringify(true));
    		}

    		if (isSessionTimeout === false) {
    			sessionStorage.setItem('startedTimeoutSession', JSON.stringify(true));
    		}

    		console.log('Fetch token in : ' + remainingTime);
    	}
    }

    function clearTokenRefreshTimeout() {
    	clearTimeout(tokenRefreshTimeout);
    }

    async function register(client, isCompany, name, email, password) {
    	await mutate(client, {
    		mutation: CREATE_USER,
    		variables: { isCompany, name, email, password }
    	}).then(() => {
    		push('/verifyaccount');
    	});
    }

    async function activateAccount(client, email, code) {
    	await mutate(client, {
    		mutation: ACTIVATE_USER,
    		variables: { email, code }
    	}).then(() => {
    		push('/login');
    	});
    }

    async function login(client, email, password, isKeepMeLoggedIn) {
    	await mutate(client, {
    		mutation: LOGIN_USER,
    		variables: { email, password }
    	}).then(result => {
    		refreshToken.set(result.data.tokenAuth.refreshToken);
    		keepMeLoggedIn.set(isKeepMeLoggedIn);
    		lastLoggedIn.set(Date.now());
    		isLoggedIn.set(true);
    		// This must be here!!!
    		localStorage.setItem('login-event', 'login' + Math.random());
    		// tokenRefreshTimeoutFunc(client);
    		// push("/dashboard/");
    	});
    }

    function logout() {
    	refreshToken.set('');
    	lastLoggedIn.set(0);
    	keepMeLoggedIn.set(false);
    	menuDisplayed.set(false);
    	isLoggedIn.set(false);
    	user.set({});
    	sessionStorage.setItem('startedTimeoutSession', JSON.stringify(false));
    	localStorage.setItem('startedTimeout', JSON.stringify(false));
    	localStorage.setItem('logout-event', 'logout' + Math.random());
    }

    async function fetchUser(client) {
    	let getUser = query(client, {
    		query: GET_USER
    	});

    	try {
    		await getUser.refetch().then(result => {
    			user.set(result.data.me);
    		});
    	} catch (error) {
    		console.log(error);
    		isLoggedIn.set(false);
    	}
    }

    async function fetchConnections(client) {
    	let getConnections = query(client, {
    		query: GET_CONNECTIONS
    	});
    	try {
    		await getConnections.refetch().then(result => {
    			connections.set(result.data.connections);
    			// console.log($connections);
    		});
    	} catch (error) {
    		console.log(error);
    		isLoggedIn.set(false);
    	}
    }

    /* src\account\SignUp.svelte generated by Svelte v3.6.7 */

    const file$2 = "src\\account\\SignUp.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    // (140:14) {#each userTypeChoices as choice}
    function create_each_block$1(ctx) {
    	var option, t_value = ctx.choice.text, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$2, 140, 16, 3574);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var t0, main, div8, div7, div0, h3, t2, h6, t4, form, fieldset, div1, select, t5, small0, t7, div2, input0, t8, div3, input1, t9, small1, t11, div4, input2, t12, div5, input3, t13, div6, t14, button, h5, t16, p, t17, a0, t19, a1, div8_intro, current, dispose;

    	var authroute = new AuthRoute({ $$inline: true });

    	var each_value = ctx.userTypeChoices;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			authroute.$$.fragment.c();
    			t0 = space();
    			main = element("main");
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Create Account";
    			t2 = space();
    			h6 = element("h6");
    			h6.textContent = "Please fill in the form below to create an account on SwapBoard";
    			t4 = space();
    			form = element("form");
    			fieldset = element("fieldset");
    			div1 = element("div");
    			select = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			small0 = element("small");
    			small0.textContent = "Please note that you can not change this later.";
    			t7 = space();
    			div2 = element("div");
    			input0 = element("input");
    			t8 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t9 = space();
    			small1 = element("small");
    			small1.textContent = "We'll never share your email with anyone else.";
    			t11 = space();
    			div4 = element("div");
    			input2 = element("input");
    			t12 = space();
    			div5 = element("div");
    			input3 = element("input");
    			t13 = space();
    			div6 = element("div");
    			t14 = space();
    			button = element("button");
    			h5 = element("h5");
    			h5.textContent = "SignUp";
    			t16 = space();
    			p = element("p");
    			t17 = text("Already registered?\r\n            ");
    			a0 = element("a");
    			a0.textContent = "Login";
    			t19 = text("\r\n            or\r\n            ");
    			a1 = element("a");
    			a1.textContent = "Verify your account";
    			attr(h3, "class", "card-title svelte-1ex7cpf");
    			add_location(h3, file$2, 127, 8, 3008);
    			attr(h6, "class", "card-subtitle mb-2 svelte-1ex7cpf");
    			add_location(h6, file$2, 128, 8, 3060);
    			attr(div0, "class", "card-header svelte-1ex7cpf");
    			add_location(div0, file$2, 126, 6, 2973);
    			if (ctx.selectedUserType === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "aria-describedby", "inputGroupSelect01");
    			attr(select, "class", "custom-select");
    			add_location(select, file$2, 135, 12, 3364);
    			attr(small0, "id", "inputGroupSelect01");
    			attr(small0, "class", "form-text text-muted note");
    			add_location(small0, file$2, 143, 12, 3679);
    			attr(div1, "class", "form-group svelte-1ex7cpf");
    			add_location(div1, file$2, 134, 10, 3326);
    			attr(input0, "type", "text");
    			attr(input0, "class", "form-control text");
    			attr(input0, "id", "exampleInputText1");
    			attr(input0, "placeholder", ctx.placeHolderName);
    			input0.required = true;
    			attr(input0, "maxlength", "60");
    			add_location(input0, file$2, 149, 12, 3971);
    			attr(div2, "class", "form-group svelte-1ex7cpf");
    			add_location(div2, file$2, 147, 10, 3859);
    			attr(input1, "type", "email");
    			attr(input1, "class", "form-control");
    			attr(input1, "id", "exampleInputEmail1");
    			attr(input1, "aria-describedby", "emailHelp");
    			attr(input1, "placeholder", "Enter a valid email address");
    			input1.required = true;
    			add_location(input1, file$2, 160, 12, 4362);
    			attr(small1, "id", "emailHelp");
    			attr(small1, "class", "form-text text-muted");
    			add_location(small1, file$2, 168, 12, 4647);
    			attr(div3, "class", "form-group svelte-1ex7cpf");
    			add_location(div3, file$2, 158, 10, 4248);
    			attr(input2, "type", "password");
    			attr(input2, "class", "form-control password");
    			attr(input2, "id", "password");
    			attr(input2, "placeholder", "Password");
    			input2.required = true;
    			attr(input2, "minlength", "8");
    			attr(input2, "maxlength", "30");
    			add_location(input2, file$2, 174, 12, 4924);
    			attr(div4, "class", "form-group svelte-1ex7cpf");
    			add_location(div4, file$2, 172, 10, 4812);
    			attr(input3, "type", "password");
    			attr(input3, "class", "form-control password");
    			attr(input3, "id", "confirmPassword");
    			attr(input3, "placeholder", "Confirm Password");
    			input3.required = true;
    			attr(input3, "minlength", "8");
    			attr(input3, "maxlength", "30");
    			add_location(input3, file$2, 186, 12, 5338);
    			attr(div5, "class", "form-group svelte-1ex7cpf");
    			add_location(div5, file$2, 184, 10, 5226);
    			attr(div6, "class", "form-group form-check svelte-1ex7cpf");
    			add_location(div6, file$2, 196, 10, 5662);
    			add_location(h5, file$2, 198, 12, 5771);
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary svelte-1ex7cpf");
    			add_location(button, file$2, 197, 10, 5711);
    			attr(a0, "href", "#/login");
    			add_location(a0, file$2, 202, 12, 5898);
    			attr(a1, "href", "#/verifyaccount");
    			add_location(a1, file$2, 204, 12, 5955);
    			attr(p, "class", "form-text text-muted svelte-1ex7cpf");
    			add_location(p, file$2, 200, 10, 5819);
    			fieldset.disabled = ctx.formIsDisabled;
    			add_location(fieldset, file$2, 133, 8, 3278);
    			attr(form, "class", "form-group svelte-1ex7cpf");
    			add_location(form, file$2, 132, 6, 3203);
    			attr(div7, "class", "card-body svelte-1ex7cpf");
    			add_location(div7, file$2, 125, 4, 2942);
    			attr(div8, "class", "card .mx-auto svelte-1ex7cpf");
    			add_location(div8, file$2, 124, 2, 2881);
    			attr(main, "class", "svelte-1ex7cpf");
    			add_location(main, file$2, 123, 0, 2871);

    			dispose = [
    				listen(select, "change", ctx.select_change_handler),
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(input3, "input", ctx.input3_input_handler),
    				listen(form, "submit", prevent_default(ctx.handleSubmit))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(authroute, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, main, anchor);
    			append(main, div8);
    			append(div8, div7);
    			append(div7, div0);
    			append(div0, h3);
    			append(div0, t2);
    			append(div0, h6);
    			append(div7, t4);
    			append(div7, form);
    			append(form, fieldset);
    			append(fieldset, div1);
    			append(div1, select);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selectedUserType);

    			append(div1, t5);
    			append(div1, small0);
    			append(fieldset, t7);
    			append(fieldset, div2);
    			append(div2, input0);

    			input0.value = ctx.name;

    			append(fieldset, t8);
    			append(fieldset, div3);
    			append(div3, input1);

    			input1.value = ctx.email;

    			append(div3, t9);
    			append(div3, small1);
    			append(fieldset, t11);
    			append(fieldset, div4);
    			append(div4, input2);

    			input2.value = ctx.password;

    			append(fieldset, t12);
    			append(fieldset, div5);
    			append(div5, input3);

    			input3.value = ctx.confirmPassword;

    			append(fieldset, t13);
    			append(fieldset, div6);
    			append(fieldset, t14);
    			append(fieldset, button);
    			append(button, h5);
    			append(fieldset, t16);
    			append(fieldset, p);
    			append(p, t17);
    			append(p, a0);
    			append(p, t19);
    			append(p, a1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.userTypeChoices) {
    				each_value = ctx.userTypeChoices;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selectedUserType) select_option(select, ctx.selectedUserType);
    			if (changed.name && (input0.value !== ctx.name)) input0.value = ctx.name;

    			if (!current || changed.placeHolderName) {
    				attr(input0, "placeholder", ctx.placeHolderName);
    			}

    			if (changed.email && (input1.value !== ctx.email)) input1.value = ctx.email;
    			if (changed.password && (input2.value !== ctx.password)) input2.value = ctx.password;
    			if (changed.confirmPassword && (input3.value !== ctx.confirmPassword)) input3.value = ctx.confirmPassword;

    			if (!current || changed.formIsDisabled) {
    				fieldset.disabled = ctx.formIsDisabled;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(authroute.$$.fragment, local);

    			if (!div8_intro) {
    				add_render_callback(() => {
    					div8_intro = create_in_transition(div8, fade, { duration: 500 });
    					div8_intro.start();
    				});
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(authroute.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(authroute, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(main);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

      // if ($isLoggedIn === true) {
      //   push("/dashboard/");
      // }

      const client = getClient();

      let userTypeChoices = [
        { id: 0, text: `Signup as company or employee` },
        { id: 1, text: `Employee` },
        { id: 2, text: `Company` }
      ];

      let selectedUserType = userTypeChoices;
      let name = "";
      let placeHolderName = "";
      let email = "";
      let password = "";
      let confirmPassword = "";
      let isCompany = false;
      let formIsDisabled = false;

      async function handleSubmit() {
        $$invalidate('formIsDisabled', formIsDisabled = true);

        setTimeout(() => {
          $$invalidate('formIsDisabled', formIsDisabled = false);
        }, 2000);

        if (name.trim().length === 0) {
          $$invalidate('name', name = "");
          return notifications.danger("You must enter a name");
        }

        if (email.trim().length === 0) {
          $$invalidate('email', email = "");
          return notifications.danger("You must enter an email");
        }

        if (selectedUserType.id === 1) {
          isCompany = false;
        } else if (selectedUserType.id === 2) {
          isCompany = true;
        } else {
          return notifications.danger("You must signup as a company or employee!");
        }

        if (password !== confirmPassword) {
          $$invalidate('password', password = "");
          $$invalidate('confirmPassword', confirmPassword = "");
          return notifications.danger("Your passwords do not match!");
        }

        try {
          await register(client, isCompany, name, email, password);
        } catch (error) {
          return notifications.danger("Email already exist");
        }
      }

    	function select_change_handler() {
    		selectedUserType = select_value(this);
    		$$invalidate('selectedUserType', selectedUserType);
    		$$invalidate('userTypeChoices', userTypeChoices);
    	}

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	function input1_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	function input2_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function input3_input_handler() {
    		confirmPassword = this.value;
    		$$invalidate('confirmPassword', confirmPassword);
    	}

    	$$self.$$.update = ($$dirty = { selectedUserType: 1 }) => {
    		if ($$dirty.selectedUserType) { if (selectedUserType.id === 1) {
            $$invalidate('placeHolderName', placeHolderName = "your name");
          } else if (selectedUserType.id === 2) {
            $$invalidate('placeHolderName', placeHolderName = "company name");
          } else {
            $$invalidate('placeHolderName', placeHolderName = "company or employee name");
          } }
    	};

    	return {
    		userTypeChoices,
    		selectedUserType,
    		name,
    		placeHolderName,
    		email,
    		password,
    		confirmPassword,
    		formIsDisabled,
    		handleSubmit,
    		select_change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	};
    }

    class SignUp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src\account\LogIn.svelte generated by Svelte v3.6.7 */

    const file$3 = "src\\account\\LogIn.svelte";

    function create_fragment$6(ctx) {
    	var t0, main, div5, div4, div0, h3, t2, h6, t4, form, fieldset, div1, input0, t5, small, div1_class_value, t7, div2, input1, t8, div3, input2, t9, label, t11, button, h5, t13, p0, t14, a0, t16, p1, a1, t18, p2, a2, div5_intro, current, dispose;

    	var authroute = new AuthRoute({ $$inline: true });

    	return {
    		c: function create() {
    			authroute.$$.fragment.c();
    			t0 = space();
    			main = element("main");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Log into SwapBoard";
    			t2 = space();
    			h6 = element("h6");
    			h6.textContent = "Please enter your email and password to login";
    			t4 = space();
    			form = element("form");
    			fieldset = element("fieldset");
    			div1 = element("div");
    			input0 = element("input");
    			t5 = space();
    			small = element("small");
    			small.textContent = "We'll never share your email with anyone else.";
    			t7 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t8 = space();
    			div3 = element("div");
    			input2 = element("input");
    			t9 = space();
    			label = element("label");
    			label.textContent = "keep me logged in";
    			t11 = space();
    			button = element("button");
    			h5 = element("h5");
    			h5.textContent = "Login";
    			t13 = space();
    			p0 = element("p");
    			t14 = text("Not registered?\r\n            ");
    			a0 = element("a");
    			a0.textContent = "Create an account";
    			t16 = space();
    			p1 = element("p");
    			a1 = element("a");
    			a1.textContent = "Forgort Password?";
    			t18 = space();
    			p2 = element("p");
    			a2 = element("a");
    			a2.textContent = "Verify your account?";
    			attr(h3, "class", "card-title svelte-1t2q2t9");
    			add_location(h3, file$3, 104, 8, 2387);
    			attr(h6, "class", "card-subtitle mb-2 svelte-1t2q2t9");
    			add_location(h6, file$3, 105, 8, 2443);
    			attr(div0, "class", "card-header svelte-1t2q2t9");
    			add_location(div0, file$3, 103, 6, 2352);
    			attr(input0, "type", "email");
    			attr(input0, "class", "form-control");
    			attr(input0, "id", "exampleInputEmail1");
    			attr(input0, "aria-describedby", "emailHelp");
    			attr(input0, "placeholder", "Enter email");
    			input0.required = true;
    			add_location(input0, file$3, 113, 12, 2803);
    			attr(small, "id", "emailHelp");
    			attr(small, "class", "form-text text-muted");
    			add_location(small, file$3, 121, 12, 3072);
    			attr(div1, "class", div1_class_value = "form-group " + ctx.formIsDisabled + " svelte-1t2q2t9");
    			add_location(div1, file$3, 111, 10, 2672);
    			attr(input1, "type", "password");
    			attr(input1, "class", "form-control password");
    			attr(input1, "id", "exampleInputPassword1");
    			attr(input1, "placeholder", "Password");
    			input1.required = true;
    			attr(input1, "minlength", "8");
    			attr(input1, "maxlength", "30");
    			add_location(input1, file$3, 127, 12, 3349);
    			attr(div2, "class", "form-group svelte-1t2q2t9");
    			add_location(div2, file$3, 125, 10, 3237);
    			attr(input2, "type", "checkbox");
    			attr(input2, "class", "form-check-input");
    			attr(input2, "id", "exampleCheck1");
    			add_location(input2, file$3, 138, 12, 3713);
    			attr(label, "class", "form-check-label");
    			attr(label, "for", "exampleCheck1");
    			add_location(label, file$3, 143, 12, 3888);
    			attr(div3, "class", "form-group form-check svelte-1t2q2t9");
    			add_location(div3, file$3, 137, 10, 3664);
    			add_location(h5, file$3, 148, 12, 4085);
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary svelte-1t2q2t9");
    			add_location(button, file$3, 147, 10, 4025);
    			attr(a0, "href", "#/signup");
    			add_location(a0, file$3, 152, 12, 4210);
    			attr(p0, "class", "form-text text-muted ca svelte-1t2q2t9");
    			add_location(p0, file$3, 150, 10, 4132);
    			attr(a1, "href", "#/recoveraccount");
    			add_location(a1, file$3, 155, 12, 4327);
    			attr(p1, "class", "form-text text-muted fp svelte-1t2q2t9");
    			add_location(p1, file$3, 154, 10, 4278);
    			attr(a2, "href", "#/verifyaccount");
    			add_location(a2, file$3, 158, 12, 4452);
    			attr(p2, "class", "form-text text-muted ca svelte-1t2q2t9");
    			add_location(p2, file$3, 157, 10, 4403);
    			fieldset.disabled = ctx.formIsDisabled;
    			add_location(fieldset, file$3, 110, 8, 2624);
    			add_location(form, file$3, 109, 6, 2568);
    			attr(div4, "class", "card-body svelte-1t2q2t9");
    			add_location(div4, file$3, 102, 4, 2321);
    			attr(div5, "class", "card svelte-1t2q2t9");
    			add_location(div5, file$3, 101, 2, 2269);
    			attr(main, "class", "svelte-1t2q2t9");
    			add_location(main, file$3, 100, 0, 2259);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "change", ctx.input2_change_handler),
    				listen(form, "submit", prevent_default(ctx.handleSubmit))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(authroute, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, main, anchor);
    			append(main, div5);
    			append(div5, div4);
    			append(div4, div0);
    			append(div0, h3);
    			append(div0, t2);
    			append(div0, h6);
    			append(div4, t4);
    			append(div4, form);
    			append(form, fieldset);
    			append(fieldset, div1);
    			append(div1, input0);

    			input0.value = ctx.email;

    			append(div1, t5);
    			append(div1, small);
    			append(fieldset, t7);
    			append(fieldset, div2);
    			append(div2, input1);

    			input1.value = ctx.password;

    			append(fieldset, t8);
    			append(fieldset, div3);
    			append(div3, input2);

    			input2.checked = ctx.isKeepMeLoggedIn;

    			append(div3, t9);
    			append(div3, label);
    			append(fieldset, t11);
    			append(fieldset, button);
    			append(button, h5);
    			append(fieldset, t13);
    			append(fieldset, p0);
    			append(p0, t14);
    			append(p0, a0);
    			append(fieldset, t16);
    			append(fieldset, p1);
    			append(p1, a1);
    			append(fieldset, t18);
    			append(fieldset, p2);
    			append(p2, a2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.email && (input0.value !== ctx.email)) input0.value = ctx.email;

    			if ((!current || changed.formIsDisabled) && div1_class_value !== (div1_class_value = "form-group " + ctx.formIsDisabled + " svelte-1t2q2t9")) {
    				attr(div1, "class", div1_class_value);
    			}

    			if (changed.password && (input1.value !== ctx.password)) input1.value = ctx.password;
    			if (changed.isKeepMeLoggedIn) input2.checked = ctx.isKeepMeLoggedIn;

    			if (!current || changed.formIsDisabled) {
    				fieldset.disabled = ctx.formIsDisabled;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(authroute.$$.fragment, local);

    			if (!div5_intro) {
    				add_render_callback(() => {
    					div5_intro = create_in_transition(div5, fade, { duration: 500 });
    					div5_intro.start();
    				});
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(authroute.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(authroute, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(main);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	
      // if ($isLoggedIn === true) {
      //   push("/dashboard/");
      // }

      const client = getClient();
      let email = "";
      let password = "";
      let isKeepMeLoggedIn = false;
      let formIsDisabled = false;

      async function handleSubmit() {
        $$invalidate('formIsDisabled', formIsDisabled = true);

        setTimeout(() => {
          $$invalidate('formIsDisabled', formIsDisabled = false);
        }, 2000);

        if (email.trim().length === 0 || password.trim().length === 0) {
          const msg = "Email or password fields can not be empty!";
          return notifications.danger(msg, 3000);
        }

        try {
          await login(client, email, password, isKeepMeLoggedIn).then(() => {
            tokenRefreshTimeoutFunc(client);
            fetchUser(client);
            fetchConnections(client);
            push("/dashboard/");
          });
        } catch (error) {
          // console.log(error);
          $$invalidate('password', password = "");
          let msg = "Please make sure your email and password are correct!";
          notifications.danger(msg, 3000);
        }
      }

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function input2_change_handler() {
    		isKeepMeLoggedIn = this.checked;
    		$$invalidate('isKeepMeLoggedIn', isKeepMeLoggedIn);
    	}

    	return {
    		email,
    		password,
    		isKeepMeLoggedIn,
    		formIsDisabled,
    		handleSubmit,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_handler
    	};
    }

    class LogIn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, []);
    	}
    }

    /* src\account\ForgotPassword.svelte generated by Svelte v3.6.7 */

    const file$4 = "src\\account\\ForgotPassword.svelte";

    function create_fragment$7(ctx) {
    	var div, h1, div_intro;

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Forgot Password Page";
    			attr(h1, "class", "svelte-ysidjt");
    			add_location(h1, file$4, 11, 2, 164);
    			add_location(div, file$4, 10, 0, 127);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    		},

    		p: noop,

    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 500 });
    					div_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    class ForgotPassword extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, []);
    	}
    }

    /* src\account\RecoverAccount.svelte generated by Svelte v3.6.7 */

    const file$5 = "src\\account\\RecoverAccount.svelte";

    function create_fragment$8(ctx) {
    	var div, h1, div_intro;

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Recover Account Page";
    			attr(h1, "class", "svelte-ysidjt");
    			add_location(h1, file$5, 11, 2, 164);
    			add_location(div, file$5, 10, 0, 127);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    		},

    		p: noop,

    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 500 });
    					div_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    class RecoverAccount extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, []);
    	}
    }

    /* src\account\VerifyAccount.svelte generated by Svelte v3.6.7 */

    const file$6 = "src\\account\\VerifyAccount.svelte";

    function create_fragment$9(ctx) {
    	var t0, main, div4, div3, div0, h3, t2, h6, t4, form, fieldset, div1, input0, t5, div2, input1, t6, button, h5, div4_intro, current, dispose;

    	var authroute = new AuthRoute({ $$inline: true });

    	return {
    		c: function create() {
    			authroute.$$.fragment.c();
    			t0 = space();
    			main = element("main");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Verify Account";
    			t2 = space();
    			h6 = element("h6");
    			h6.textContent = "Please enter your email and the code that was sent to your email";
    			t4 = space();
    			form = element("form");
    			fieldset = element("fieldset");
    			div1 = element("div");
    			input0 = element("input");
    			t5 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t6 = space();
    			button = element("button");
    			h5 = element("h5");
    			h5.textContent = "Confirm Account";
    			attr(h3, "class", "card-title svelte-92piy6");
    			add_location(h3, file$6, 81, 8, 1812);
    			attr(h6, "class", "card-subtitle mb-2 svelte-92piy6");
    			add_location(h6, file$6, 82, 8, 1864);
    			attr(div0, "class", "card-header svelte-92piy6");
    			add_location(div0, file$6, 80, 6, 1777);
    			attr(input0, "type", "email");
    			attr(input0, "class", "form-control");
    			attr(input0, "id", "exampleInputEmail1");
    			attr(input0, "aria-describedby", "emailHelp");
    			attr(input0, "placeholder", "Enter email");
    			add_location(input0, file$6, 90, 12, 2226);
    			attr(div1, "class", "form-group svelte-92piy6");
    			add_location(div1, file$6, 88, 10, 2112);
    			attr(input1, "type", "text");
    			attr(input1, "class", "form-control");
    			attr(input1, "id", "exampleInputText1");
    			attr(input1, "aria-describedby", "textHelp");
    			attr(input1, "placeholder", "Enter code");
    			add_location(input1, file$6, 99, 12, 2525);
    			attr(div2, "class", "form-group svelte-92piy6");
    			add_location(div2, file$6, 98, 10, 2487);
    			add_location(h5, file$6, 109, 12, 2843);
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary svelte-92piy6");
    			add_location(button, file$6, 108, 10, 2783);
    			fieldset.disabled = ctx.formIsDisabled;
    			add_location(fieldset, file$6, 87, 8, 2064);
    			add_location(form, file$6, 86, 6, 2008);
    			attr(div3, "class", "card-body svelte-92piy6");
    			add_location(div3, file$6, 79, 4, 1746);
    			attr(div4, "class", "card svelte-92piy6");
    			add_location(div4, file$6, 78, 2, 1694);
    			attr(main, "class", "svelte-92piy6");
    			add_location(main, file$6, 77, 0, 1684);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(form, "submit", prevent_default(ctx.handleSubmit))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(authroute, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, main, anchor);
    			append(main, div4);
    			append(div4, div3);
    			append(div3, div0);
    			append(div0, h3);
    			append(div0, t2);
    			append(div0, h6);
    			append(div3, t4);
    			append(div3, form);
    			append(form, fieldset);
    			append(fieldset, div1);
    			append(div1, input0);

    			input0.value = ctx.email;

    			append(fieldset, t5);
    			append(fieldset, div2);
    			append(div2, input1);

    			input1.value = ctx.code;

    			append(fieldset, t6);
    			append(fieldset, button);
    			append(button, h5);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.email && (input0.value !== ctx.email)) input0.value = ctx.email;
    			if (changed.code && (input1.value !== ctx.code)) input1.value = ctx.code;

    			if (!current || changed.formIsDisabled) {
    				fieldset.disabled = ctx.formIsDisabled;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(authroute.$$.fragment, local);

    			if (!div4_intro) {
    				add_render_callback(() => {
    					div4_intro = create_in_transition(div4, fade, { duration: 500 });
    					div4_intro.start();
    				});
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(authroute.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(authroute, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(main);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	

      const client = getClient();

      let email = "";
      let code = "";
      let formIsDisabled = false;

      async function handleSubmit() {
        $$invalidate('formIsDisabled', formIsDisabled = true);

        setTimeout(() => {
          $$invalidate('formIsDisabled', formIsDisabled = false);
        }, 2000);

        if (email.trim().length === 0 || code.trim().length === 0) {
          $$invalidate('email', email = "");
          $$invalidate('code', code = "");
          return notifications.danger("Email or code fields can not be empty");
        }

        try {
          await activateAccount(client, email, code);
        } catch (error) {
          // console.log(error);
          notifications.danger("Please make sure your code and email are correct");
        }
      }

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	function input1_input_handler() {
    		code = this.value;
    		$$invalidate('code', code);
    	}

    	return {
    		email,
    		code,
    		formIsDisabled,
    		handleSubmit,
    		input0_input_handler,
    		input1_input_handler
    	};
    }

    class VerifyAccount extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$9, safe_not_equal, []);
    	}
    }

    /* src\dashboard\InviteEmployee.svelte generated by Svelte v3.6.7 */

    const file$7 = "src\\dashboard\\InviteEmployee.svelte";

    function create_fragment$a(ctx) {
    	var main, div2, div1, form, fieldset, div0, input, t, button, main_intro, dispose;

    	return {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div1 = element("div");
    			form = element("form");
    			fieldset = element("fieldset");
    			div0 = element("div");
    			input = element("input");
    			t = space();
    			button = element("button");
    			button.textContent = "Send Invite";
    			attr(input, "type", "email");
    			attr(input, "id", "email");
    			attr(input, "class", "form-control");
    			input.required = true;
    			attr(input, "placeholder", "Enter employee email");
    			add_location(input, file$7, 58, 12, 1449);
    			attr(div0, "class", "form-group");
    			add_location(div0, file$7, 57, 10, 1411);
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary");
    			add_location(button, file$7, 66, 10, 1686);
    			fieldset.disabled = ctx.formIsDisabled;
    			add_location(fieldset, file$7, 56, 8, 1363);
    			add_location(form, file$7, 55, 6, 1307);
    			attr(div1, "class", "card-body svelte-1wydt8p");
    			add_location(div1, file$7, 54, 4, 1276);
    			attr(div2, "class", "card");
    			add_location(div2, file$7, 53, 2, 1252);
    			attr(main, "class", "svelte-1wydt8p");
    			add_location(main, file$7, 52, 0, 1214);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(form, "submit", prevent_default(ctx.handleSubmit))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div2);
    			append(div2, div1);
    			append(div1, form);
    			append(form, fieldset);
    			append(fieldset, div0);
    			append(div0, input);

    			input.value = ctx.email;

    			append(fieldset, t);
    			append(fieldset, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.email && (input.value !== ctx.email)) input.value = ctx.email;

    			if (changed.formIsDisabled) {
    				fieldset.disabled = ctx.formIsDisabled;
    			}
    		},

    		i: function intro(local) {
    			if (!main_intro) {
    				add_render_callback(() => {
    					main_intro = create_in_transition(main, fade, { duration: 500 });
    					main_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	

      const client = getClient();

      let email = "";
      let formIsDisabled = false;

      function handleSubmit() {
        if (!email) {
          return;
        }

        sendInvitation();
      }

      async function sendInvitation() {
        $$invalidate('formIsDisabled', formIsDisabled = true);
        try {
          await mutate(client, {
            mutation: SEND_INVITATION,
            variables: { employeeEmail: email }
          }).then(result => {
            console.log(result.data.createUserConnection.userConnection);
            notifications.success("Invite Sent!");
            $$invalidate('email', email = "");
            $$invalidate('formIsDisabled', formIsDisabled = false);
          });
        } catch (error) {
          console.log(error);
          notifications.danger("Something went wrong, please try again!");
          $$invalidate('formIsDisabled', formIsDisabled = false);
        }
      }

    	function input_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	return {
    		email,
    		formIsDisabled,
    		handleSubmit,
    		input_input_handler
    	};
    }

    class InviteEmployee extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$a, safe_not_equal, []);
    	}
    }

    /**
     * generic function to inject data into token-laden string
     * @param str {String} Required
     * @param name {String} Required
     * @param value {String|Integer} Required
     * @returns {String}
     *
     * @example
     * injectStringData("The following is a token: #{tokenName}", "tokenName", 123); 
     * @returns {String} "The following is a token: 123"
     *
     */
    const injectStringData = (str,name,value) => str
      .replace(new RegExp('#{'+name+'}','g'), value);

    /**
     * Generic function to enforce length of string. 
     * 
     * Pass a string or number to this function and specify the desired length.
     * This function will either pad the # with leading 0's (if str.length < length)
     * or remove data from the end (@fromBack==false) or beginning (@fromBack==true)
     * of the string when str.length > length.
     *
     * When length == str.length or typeof length == 'undefined', this function
     * returns the original @str parameter.
     * 
     * @param str {String} Required
     * @param length {Integer} Required
     * @param fromBack {Boolean} Optional
     * @returns {String}
     *
     */
    const enforceLength = function(str,length,fromBack) {
      str = str.toString();
      if(typeof length == 'undefined') return str;
      if(str.length == length) return str;
      fromBack = (typeof fromBack == 'undefined') ? false : fromBack;
      if(str.length < length) {
        // pad the beginning of the string w/ enough 0's to reach desired length:
        while(length - str.length > 0) str = '0' + str;
      } else if(str.length > length) {
        if(fromBack) {
          // grab the desired #/chars from end of string: ex: '2015' -> '15'
          str = str.substring(str.length-length);
        } else {
          // grab the desired #/chars from beginning of string: ex: '2015' -> '20'
          str = str.substring(0,length);
        }
      }
      return str;
    };

    const daysOfWeek = [ 
      'Sunday', 
      'Monday', 
      'Tuesday', 
      'Wednesday', 
      'Thursday', 
      'Friday', 
      'Saturday' 
    ];

    const monthsOfYear = [ 
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    let dictionary = { 
      daysOfWeek, 
      monthsOfYear
    };

    var acceptedDateTokens = [
      { 
        // d: day of the month, 2 digits with leading zeros:
        key: 'd', 
        method: function(date) { return enforceLength(date.getDate(), 2); } 
      }, { 
        // D: textual representation of day, 3 letters: Sun thru Sat
        key: 'D', 
        method: function(date) { return enforceLength(dictionary.daysOfWeek[date.getDay()],3); } 
      }, { 
        // j: day of month without leading 0's
        key: 'j', 
        method: function(date) { return date.getDate(); } 
      }, { 
        // l: full textual representation of day of week: Sunday thru Saturday
        key: 'l', 
        method: function(date) { return dictionary.daysOfWeek[date.getDay()]; } 
      }, { 
        // F: full text month: 'January' thru 'December'
        key: 'F', 
        method: function(date) { return dictionary.monthsOfYear[date.getMonth()]; } 
      }, { 
        // m: 2 digit numeric month: '01' - '12':
        key: 'm', 
        method: function(date) { return enforceLength(date.getMonth()+1,2); } 
      }, { 
        // M: a short textual representation of the month, 3 letters: 'Jan' - 'Dec'
        key: 'M', 
        method: function(date) { return enforceLength(dictionary.monthsOfYear[date.getMonth()],3); } 
      }, { 
        // n: numeric represetation of month w/o leading 0's, '1' - '12':
        key: 'n', 
        method: function(date) { return date.getMonth() + 1; } 
      }, { 
        // Y: Full numeric year, 4 digits
        key: 'Y', 
        method: function(date) { return date.getFullYear(); } 
      }, { 
        // y: 2 digit numeric year:
        key: 'y', 
        method: function(date) { return enforceLength(date.getFullYear(),2,true); }
       }
    ];

    var acceptedTimeTokens = [
      { 
        // a: lowercase ante meridiem and post meridiem 'am' or 'pm'
        key: 'a', 
        method: function(date) { return (date.getHours() > 11) ? 'pm' : 'am'; } 
      }, { 
        // A: uppercase ante merdiiem and post meridiem 'AM' or 'PM'
        key: 'A', 
        method: function(date) { return (date.getHours() > 11) ? 'PM' : 'AM'; } 
      }, { 
        // g: 12-hour format of an hour without leading zeros 1-12
        key: 'g', 
        method: function(date) { return date.getHours() % 12 || 12; } 
      }, { 
        // G: 24-hour format of an hour without leading zeros 0-23
        key: 'G', 
        method: function(date) { return date.getHours(); } 
      }, { 
        // h: 12-hour format of an hour with leading zeros 01-12
        key: 'h', 
        method: function(date) { return enforceLength(date.getHours()%12 || 12,2); } 
      }, { 
        // H: 24-hour format of an hour with leading zeros: 00-23
        key: 'H', 
        method: function(date) { return enforceLength(date.getHours(),2); } 
      }, { 
        // i: Minutes with leading zeros 00-59
        key: 'i', 
        method: function(date) { return enforceLength(date.getMinutes(),2); } 
      }, { 
        // s: Seconds with leading zeros 00-59
        key: 's', 
        method: function(date) { return enforceLength(date.getSeconds(),2); }
       }
    ];

    /**
     * generic formatDate function which accepts dynamic templates
     * @param date {Date} Required
     * @param template {String} Optional
     * @returns {String}
     *
     * @example
     * formatDate(new Date(), '#{M}. #{j}, #{Y}')
     * @returns {Number} Returns a formatted date
     *
     */
    const formatDate = (date,template='#{m}/#{d}/#{Y}') => {
      acceptedDateTokens.forEach(token => {
        if(template.indexOf(`#{${token.key}}`) == -1) return; 
        template = injectStringData(template,token.key,token.method(date));
      }); 
      acceptedTimeTokens.forEach(token => {
        if(template.indexOf(`#{${token.key}}`) == -1) return;
        template = injectStringData(template,token.key,token.method(date));
      });
      return template;
    };

    /* src\dashboard\Invitation.svelte generated by Svelte v3.6.7 */
    const { console: console_1 } = globals;

    const file$8 = "src\\dashboard\\Invitation.svelte";

    // (64:6) {:else}
    function create_else_block(ctx) {
    	var p, t_1, button, dispose;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please accept invitation to post and swap shifts with your colleagues.";
    			t_1 = space();
    			button = element("button");
    			button.textContent = "Accept";
    			attr(p, "class", "card-text");
    			add_location(p, file$8, 64, 8, 2064);
    			attr(button, "class", "btn btn-primary");
    			add_location(button, file$8, 67, 8, 2191);
    			dispose = listen(button, "click", ctx.confirmInvitation);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			insert(target, t_1, anchor);
    			insert(target, button, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    				detach(t_1);
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    // (59:38) 
    function create_if_block_1(ctx) {
    	var p, t_1, h5;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You need to request another invite from your company's admin.";
    			t_1 = space();
    			h5 = element("h5");
    			h5.textContent = "You declined this invitation!";
    			attr(p, "class", "card-text");
    			add_location(p, file$8, 59, 8, 1883);
    			add_location(h5, file$8, 62, 8, 2001);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			insert(target, t_1, anchor);
    			insert(target, h5, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    				detach(t_1);
    				detach(h5);
    			}
    		}
    	};
    }

    // (54:6) {#if invitation.isConfirmed}
    function create_if_block(ctx) {
    	var p, t_1, h5;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You can now post and swap shifts with your colleagues in this company.";
    			t_1 = space();
    			h5 = element("h5");
    			h5.textContent = "You have already accepted this invitation!";
    			attr(p, "class", "card-text");
    			add_location(p, file$8, 54, 8, 1655);
    			add_location(h5, file$8, 57, 8, 1782);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			insert(target, t_1, anchor);
    			insert(target, h5, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    				detach(t_1);
    				detach(h5);
    			}
    		}
    	};
    }

    function create_fragment$b(ctx) {
    	var main, div2, div0, t0, t1_value = formatDate(new Date(ctx.invitation.created), dateFormat), t1, t2, div1, h5, t3, t4_value = ctx.invitation.company.userprofile.companyName, t4, t5, main_intro;

    	function select_block_type(ctx) {
    		if (ctx.invitation.isConfirmed) return create_if_block;
    		if (ctx.invitation.isDeclined) return create_if_block_1;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text("Invitation sent on ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			h5 = element("h5");
    			t3 = text("From ");
    			t4 = text(t4_value);
    			t5 = space();
    			if_block.c();
    			attr(div0, "class", "card-header");
    			add_location(div0, file$8, 46, 4, 1359);
    			attr(h5, "class", "card-title");
    			add_location(h5, file$8, 50, 6, 1514);
    			attr(div1, "class", "card-body");
    			add_location(div1, file$8, 49, 4, 1483);
    			attr(div2, "class", "card");
    			add_location(div2, file$8, 45, 2, 1335);
    			attr(main, "class", "svelte-cgz76s");
    			add_location(main, file$8, 44, 0, 1295);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div2);
    			append(div2, div0);
    			append(div0, t0);
    			append(div0, t1);
    			append(div2, t2);
    			append(div2, div1);
    			append(div1, h5);
    			append(h5, t3);
    			append(h5, t4);
    			append(div1, t5);
    			if_block.m(div1, null);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.invitation) && t1_value !== (t1_value = formatDate(new Date(ctx.invitation.created), dateFormat))) {
    				set_data(t1, t1_value);
    			}

    			if ((changed.invitation) && t4_value !== (t4_value = ctx.invitation.company.userprofile.companyName)) {
    				set_data(t4, t4_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},

    		i: function intro(local) {
    			if (!main_intro) {
    				add_render_callback(() => {
    					main_intro = create_in_transition(main, fade, { transition: 500 });
    					main_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			if_block.d();
    		}
    	};
    }

    let dateFormat = "#{l}, #{F} #{j}, #{Y} at #{H}:#{i}";

    function instance$8($$self, $$props, $$invalidate) {
    	let $invitations;

    	validate_store(invitations, 'invitations');
    	subscribe($$self, invitations, $$value => { $invitations = $$value; $$invalidate('$invitations', $invitations); });

    	

      let { invitation } = $$props;
      const client = getClient();

      async function confirmInvitation() {
        try {
          await mutate(client, {
            mutation: CONFIRM_INVITATION,
            variables: { invitationId: invitation.id }
          }).then(result => {
            var invite = result.data.confirmUserConnection.userConnection;
            var foundIndex = $invitations.findIndex(x => x.id === invite.id);
            $invitations[foundIndex] = invite; invitations.set($invitations);
            notifications.success(
              "Congratulations! You have successfully joined " +
                invite.company.userprofile.companyName,
              4000
            );
          });
        } catch (error) {
          console.log(error);
          notifications.danger("Something went wrong, please try again!");
        }
      }

    	const writable_props = ['invitation'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Invitation> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('invitation' in $$props) $$invalidate('invitation', invitation = $$props.invitation);
    	};

    	return { invitation, confirmInvitation };
    }

    class Invitation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$b, safe_not_equal, ["invitation"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.invitation === undefined && !('invitation' in props)) {
    			console_1.warn("<Invitation> was created without expected prop 'invitation'");
    		}
    	}

    	get invitation() {
    		throw new Error("<Invitation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invitation(value) {
    		throw new Error("<Invitation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\dashboard\Invitations.svelte generated by Svelte v3.6.7 */

    const file$9 = "src\\dashboard\\Invitations.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.invite = list[i];
    	return child_ctx;
    }

    // (43:4) {:else}
    function create_else_block$1(ctx) {
    	var h5;

    	return {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "No new Invitation(s), please request an invite from your company's\r\n        admin!";
    			add_location(h5, file$9, 43, 6, 949);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h5, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h5);
    			}
    		}
    	};
    }

    // (39:4) {#if $invitations.length > 0}
    function create_if_block$1(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.$invitations;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.$invitations) {
    				each_value = ctx.$invitations;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (40:6) {#each $invitations as invite}
    function create_each_block$2(ctx) {
    	var current;

    	var invitation = new Invitation({
    		props: { invitation: ctx.invite },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			invitation.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(invitation, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var invitation_changes = {};
    			if (changed.$invitations) invitation_changes.invitation = ctx.invite;
    			invitation.$set(invitation_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(invitation.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(invitation.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(invitation, detaching);
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	var main, div, current_block_type_index, if_block, current;

    	var if_block_creators = [
    		create_if_block$1,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.$invitations.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			if_block.c();
    			add_location(div, file$9, 37, 2, 791);
    			attr(main, "class", "svelte-3xtjq7");
    			add_location(main, file$9, 36, 0, 781);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $invitations;

    	validate_store(invitations, 'invitations');
    	subscribe($$self, invitations, $$value => { $invitations = $$value; $$invalidate('$invitations', $invitations); });

    	

      const client = getClient();

      const getInvitations = query(client, {
        query: GET_INVITATIONS
      });

      async function fetchInvitations() {
        try {
          await getInvitations.refetch().then(result => {
            invitations.set(result.data.invitations);
            // console.log($invitations);
          });
        } catch (error) {
          console.log(error);
        }
      }

      onMount(() => {
        fetchInvitations();
      });

    	return { $invitations };
    }

    class Invitations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$c, safe_not_equal, []);
    	}
    }

    /* src\dashboard\Shifts.svelte generated by Svelte v3.6.7 */

    const file$a = "src\\dashboard\\Shifts.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.shift = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    // (248:2) {#if !$user.isCompany}
    function create_if_block_8(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.$connections.length > 0) && create_if_block_9(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.$connections.length > 0) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_9(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (249:4) {#if $connections.length > 0}
    function create_if_block_9(ctx) {
    	var div0, div0_class_value, t, div2, div1, select, option, div2_class_value, dispose;

    	var each_value_2 = ctx.$connections;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	return {
    		c: function create() {
    			div0 = element("div");
    			t = space();
    			div2 = element("div");
    			div1 = element("div");
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select Company";

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div0, "id", "empty-container");
    			attr(div0, "class", div0_class_value = "" + (ctx.$menuDisplayed ? 'menuDisplayed' : '') + " fixed-top" + " svelte-f4t0hs");
    			add_location(div0, file$a, 249, 6, 6022);
    			option.__value = "";
    			option.value = option.__value;
    			option.selected = true;
    			option.disabled = true;
    			option.hidden = true;
    			add_location(option, file$a, 259, 12, 6439);
    			if (ctx.selectedCompany === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "id", "company-selector");
    			attr(select, "class", "custom-select");
    			add_location(select, file$a, 254, 10, 6259);
    			attr(div1, "class", "input-group mb-3");
    			add_location(div1, file$a, 253, 8, 6217);
    			attr(div2, "id", "form");
    			attr(div2, "class", div2_class_value = "" + (ctx.$menuDisplayed ? 'menuDisplayed' : '') + " fixed-top" + " svelte-f4t0hs");
    			add_location(div2, file$a, 252, 6, 6134);

    			dispose = [
    				listen(select, "change", ctx.select_change_handler),
    				listen(select, "change", ctx.fetchShiftsFromInput)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t, anchor);
    			insert(target, div2, anchor);
    			append(div2, div1);
    			append(div1, select);
    			append(select, option);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selectedCompany);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$menuDisplayed) && div0_class_value !== (div0_class_value = "" + (ctx.$menuDisplayed ? 'menuDisplayed' : '') + " fixed-top" + " svelte-f4t0hs")) {
    				attr(div0, "class", div0_class_value);
    			}

    			if (changed.$connections) {
    				each_value_2 = ctx.$connections;

    				for (var i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_2.length;
    			}

    			if (changed.selectedCompany) select_option(select, ctx.selectedCompany);

    			if ((changed.$menuDisplayed) && div2_class_value !== (div2_class_value = "" + (ctx.$menuDisplayed ? 'menuDisplayed' : '') + " fixed-top" + " svelte-f4t0hs")) {
    				attr(div2, "class", div2_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t);
    				detach(div2);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    // (261:12) {#each $connections as choice}
    function create_each_block_2(ctx) {
    	var option, t0_value = ctx.choice.company.userprofile.companyName, t0, t1, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$a, 261, 14, 6564);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			append(option, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$connections) && t0_value !== (t0_value = ctx.choice.company.userprofile.companyName)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.$connections) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (271:2) {#if $connections.length < 1}
    function create_if_block_6(ctx) {
    	var if_block_anchor;

    	function select_block_type(ctx) {
    		if (!ctx.$user.isCompany) return create_if_block_7;
    		return create_else_block_3;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (279:4) {:else}
    function create_else_block_3(ctx) {
    	var div, h5;

    	return {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "You do not have any staff on your company yet, please send invites to\r\n          your employees for them to start swapping shifts.";
    			add_location(h5, file$a, 280, 8, 7076);
    			add_location(div, file$a, 279, 6, 7061);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (272:4) {#if !$user.isCompany}
    function create_if_block_7(ctx) {
    	var div, h5;

    	return {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "You are not a member of any company yet, please request an invite from\r\n          your company's admin to start swapping shifts with your colleagues.";
    			add_location(h5, file$a, 273, 8, 6846);
    			add_location(div, file$a, 272, 6, 6831);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (289:4) {#if $shifts.length > 0}
    function create_if_block_5(ctx) {
    	var each_blocks = [], each_1_lookup = new Map(), each_1_anchor;

    	var each_value_1 = ctx.$shifts;

    	const get_key = ctx => ctx.shift.id;

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	return {
    		c: function create() {
    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(target, anchor);

    			insert(target, each_1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			const each_value_1 = ctx.$shifts;
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    		},

    		d: function destroy(detaching) {
    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d(detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (290:6) {#each $shifts as shift, i (shift.id)}
    function create_each_block_1(key_1, ctx) {
    	var ul, li0, t0_value = formatDate(new Date(ctx.shift.fromTime), dateFormat$1), t0, t1, li1, t2_value = formatDate(new Date(ctx.shift.toTime), dateFormat$1), t2, t3, li2, t4_value = ctx.shift.postedBy.userprofile.firstName + ' ' + ctx.shift.postedBy.userprofile.lastName, t4, t5, i = ctx.i, dispose;

    	const assign_ul = () => ctx.ul_binding(ul, i);
    	const unassign_ul = () => ctx.ul_binding(null, i);

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			li1 = element("li");
    			t2 = text(t2_value);
    			t3 = space();
    			li2 = element("li");
    			t4 = text(t4_value);
    			t5 = space();
    			attr(li0, "class", "list-group-item flex-fill");
    			add_location(li0, file$a, 298, 10, 7670);
    			attr(li1, "class", "list-group-item flex-fill");
    			add_location(li1, file$a, 301, 10, 7801);
    			attr(li2, "class", "list-group-item flex-fill");
    			add_location(li2, file$a, 304, 10, 7930);
    			attr(ul, "id", "inner-list-group");
    			attr(ul, "class", "list-group list-group-action list-group-horizontal\r\n          list-group-flush svelte-f4t0hs");
    			add_location(ul, file$a, 290, 8, 7402);
    			dispose = listen(ul, "click", click_handler);
    			this.first = ul;
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);
    			append(ul, li0);
    			append(li0, t0);
    			append(ul, t1);
    			append(ul, li1);
    			append(li1, t2);
    			append(ul, t3);
    			append(ul, li2);
    			append(li2, t4);
    			append(ul, t5);
    			assign_ul();
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.$shifts) && t0_value !== (t0_value = formatDate(new Date(ctx.shift.fromTime), dateFormat$1))) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.$shifts) && t2_value !== (t2_value = formatDate(new Date(ctx.shift.toTime), dateFormat$1))) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.$shifts) && t4_value !== (t4_value = ctx.shift.postedBy.userprofile.firstName + ' ' + ctx.shift.postedBy.userprofile.lastName)) {
    				set_data(t4, t4_value);
    			}

    			if (i !== ctx.i) {
    				unassign_ul();
    				i = ctx.i;
    				assign_ul();
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}

    			unassign_ul();
    			dispose();
    		}
    	};
    }

    // (316:8) {#if clickedShift}
    function create_if_block$2(ctx) {
    	var if_block_anchor;

    	function select_block_type_1(ctx) {
    		if (!ctx.$user.isCompany) return create_if_block_1$1;
    		return create_else_block_2;
    	}

    	var current_block_type = select_block_type_1(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (357:10) {:else}
    function create_else_block_2(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This shift was posted to your company.";
    			attr(p, "class", "svelte-f4t0hs");
    			add_location(p, file$a, 357, 12, 9969);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (317:10) {#if !$user.isCompany}
    function create_if_block_1$1(ctx) {
    	var if_block_anchor;

    	function select_block_type_2(ctx) {
    		if (ctx.$user.id !== ctx.clickedShift.postedBy.id) return create_if_block_2;
    		return create_else_block_1;
    	}

    	var current_block_type = select_block_type_2(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (354:12) {:else}
    function create_else_block_1(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is your shift!!!";
    			attr(p, "class", "svelte-f4t0hs");
    			add_location(p, file$a, 354, 14, 9889);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (318:12) {#if $user.id !== clickedShift.postedBy.id}
    function create_if_block_2(ctx) {
    	var t, if_block1_anchor;

    	function select_block_type_3(ctx) {
    		if (ctx.myShifts.length > 0) return create_if_block_4;
    		return create_else_block$2;
    	}

    	var current_block_type = select_block_type_3(ctx);
    	var if_block0 = current_block_type(ctx);

    	var if_block1 = (ctx.selectedShift) && create_if_block_3(ctx);

    	return {
    		c: function create() {
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block0) {
    				if_block0.p(changed, ctx);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);
    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			}

    			if (ctx.selectedShift) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if_block0.d(detaching);

    			if (detaching) {
    				detach(t);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(if_block1_anchor);
    			}
    		}
    	};
    }

    // (337:14) {:else}
    function create_else_block$2(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You do not have any shift to propose, post shift to start\r\n                  swapping.";
    			attr(p, "class", "svelte-f4t0hs");
    			add_location(p, file$a, 337, 16, 9249);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (319:14) {#if myShifts.length > 0}
    function create_if_block_4(ctx) {
    	var div, select, option, dispose;

    	var each_value = ctx.myShifts;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select shift to propose\r\n                    ";

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			option.__value = "";
    			option.value = option.__value;
    			option.selected = true;
    			option.disabled = true;
    			option.hidden = true;
    			add_location(option, file$a, 324, 20, 8667);
    			if (ctx.selectedShift === void 0) add_render_callback(() => ctx.select_change_handler_1.call(select));
    			attr(select, "id", "myShift-selector");
    			attr(select, "class", "custom-select");
    			add_location(select, file$a, 320, 18, 8503);
    			attr(div, "class", "input-group mb-3");
    			add_location(div, file$a, 319, 16, 8453);
    			dispose = listen(select, "change", ctx.select_change_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, select);
    			append(select, option);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selectedShift);
    		},

    		p: function update(changed, ctx) {
    			if (changed.myShifts || changed.formatDate || changed.dateFormat) {
    				each_value = ctx.myShifts;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selectedShift) select_option(select, ctx.selectedShift);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    // (328:20) {#each myShifts as choice}
    function create_each_block$3(ctx) {
    	var option, p, t0_value = 'Starts ' + formatDate(new Date(ctx.choice.fromTime), dateFormat$1) + ' Ends ' + formatDate(new Date(ctx.choice.toTime), dateFormat$1), t0, t1, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(p, "class", "svelte-f4t0hs");
    			add_location(p, file$a, 329, 24, 8908);
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$a, 328, 22, 8859);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, p);
    			append(p, t0);
    			append(option, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.myShifts) && t0_value !== (t0_value = 'Starts ' + formatDate(new Date(ctx.choice.fromTime), dateFormat$1) + ' Ends ' + formatDate(new Date(ctx.choice.toTime), dateFormat$1))) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.myShifts) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (343:14) {#if selectedShift}
    function create_if_block_3(ctx) {
    	var p0, t0, t1_value = formatDate(new Date(ctx.selectedShift.fromTime), dateFormat$1), t1, t2, p1, t3, t4_value = formatDate(new Date(ctx.selectedShift.toTime), dateFormat$1), t4, t5, button, dispose;

    	return {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Starts ");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Ends ");
    			t4 = text(t4_value);
    			t5 = space();
    			button = element("button");
    			button.textContent = "Propose Selected Shift";
    			attr(p0, "class", "svelte-f4t0hs");
    			add_location(p0, file$a, 343, 16, 9454);
    			attr(p1, "class", "svelte-f4t0hs");
    			add_location(p1, file$a, 346, 16, 9582);
    			attr(button, "class", "btn btn-primary");
    			add_location(button, file$a, 349, 16, 9706);
    			dispose = listen(button, "click", ctx.proposeShift);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p0, anchor);
    			append(p0, t0);
    			append(p0, t1);
    			insert(target, t2, anchor);
    			insert(target, p1, anchor);
    			append(p1, t3);
    			append(p1, t4);
    			insert(target, t5, anchor);
    			insert(target, button, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.selectedShift) && t1_value !== (t1_value = formatDate(new Date(ctx.selectedShift.fromTime), dateFormat$1))) {
    				set_data(t1, t1_value);
    			}

    			if ((changed.selectedShift) && t4_value !== (t4_value = formatDate(new Date(ctx.selectedShift.toTime), dateFormat$1))) {
    				set_data(t4, t4_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p0);
    				detach(t2);
    				detach(p1);
    				detach(t5);
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	var main, t0, t1, div2, t2, div1, div0, div1_class_value, main_intro;

    	var if_block0 = (!ctx.$user.isCompany) && create_if_block_8(ctx);

    	var if_block1 = (ctx.$connections.length < 1) && create_if_block_6(ctx);

    	var if_block2 = (ctx.$shifts.length > 0) && create_if_block_5(ctx);

    	var if_block3 = (ctx.clickedShift) && create_if_block$2(ctx);

    	return {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div2 = element("div");
    			if (if_block2) if_block2.c();
    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block3) if_block3.c();
    			attr(div0, "class", "popover__content svelte-f4t0hs");
    			add_location(div0, file$a, 314, 6, 8245);
    			attr(div1, "id", "popover__wrapper");
    			attr(div1, "class", div1_class_value = "" + (ctx.showing ? 'show' : 'hide') + " svelte-f4t0hs");
    			add_location(div1, file$a, 310, 4, 8128);
    			attr(div2, "class", "content svelte-f4t0hs");
    			add_location(div2, file$a, 287, 2, 7275);
    			attr(main, "class", "svelte-f4t0hs");
    			add_location(main, file$a, 246, 0, 5919);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append(main, t0);
    			if (if_block1) if_block1.m(main, null);
    			append(main, t1);
    			append(main, div2);
    			if (if_block2) if_block2.m(div2, null);
    			append(div2, t2);
    			append(div2, div1);
    			append(div1, div0);
    			if (if_block3) if_block3.m(div0, null);
    			ctx.div1_binding(div1);
    			ctx.div2_binding(div2);
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.$user.isCompany) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.$connections.length < 1) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(main, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (ctx.$shifts.length > 0) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					if_block2.m(div2, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (ctx.clickedShift) {
    				if (if_block3) {
    					if_block3.p(changed, ctx);
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if ((changed.showing) && div1_class_value !== (div1_class_value = "" + (ctx.showing ? 'show' : 'hide') + " svelte-f4t0hs")) {
    				attr(div1, "class", div1_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (!main_intro) {
    				add_render_callback(() => {
    					main_intro = create_in_transition(main, fade, { duration: 500 });
    					main_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			ctx.div1_binding(null);
    			ctx.div2_binding(null);
    		}
    	};
    }

    let dateFormat$1 = "#{l}, #{F} #{j}, #{Y} at #{H}:#{i}";

    function instance$a($$self, $$props, $$invalidate) {
    	let $shifts, $user, $connections, $menuDisplayed;

    	validate_store(shifts, 'shifts');
    	subscribe($$self, shifts, $$value => { $shifts = $$value; $$invalidate('$shifts', $shifts); });
    	validate_store(user, 'user');
    	subscribe($$self, user, $$value => { $user = $$value; $$invalidate('$user', $user); });
    	validate_store(connections, 'connections');
    	subscribe($$self, connections, $$value => { $connections = $$value; $$invalidate('$connections', $connections); });
    	validate_store(menuDisplayed, 'menuDisplayed');
    	subscribe($$self, menuDisplayed, $$value => { $menuDisplayed = $$value; $$invalidate('$menuDisplayed', $menuDisplayed); });

    	

      // let shifts = [];
      let myShifts = [];
      let selectedShift;
      let clickedShift;
      let showing = false;
      let requestingShiftConnection = false;
      let selectedCompany;
      let selectedCompanyId = "";
      let popoverX;
      let popoverY;
      let popoverWrapper;
      let content;
      let uls = [];

      const client = getClient();

      async function fetchShiftsFromInput() {
        if (!selectedCompany) {
          return;
        }

        selectedCompanyId = selectedCompany.company.id;

        fetchShifts();
      }

      async function fetchShifts() {
        const getShifts = query(client, {
          query: GET_SHIFTS,
          variables: { companyId: selectedCompanyId }
        });

        try {
          await getShifts.refetch().then(result => {
            shifts.set(result.data.shifts);
            $$invalidate('myShifts', myShifts = $shifts.filter(shift => shift.postedBy.id === $user.id));
            // console.log(myShifts);
            // console.log($shifts);
          });
        } catch (error) {
          console.log(error);
        }
      }

      async function proposeShift() {
        if (requestingShiftConnection === true) {
          notifications.info("A Shift Request is in progress!");
          return;
        }

        if (!selectedShift || !clickedShift) {
          notifications.danger("You must select a shift to propose");
          return;
        }

        requestingShiftConnection = true;

        try {
          await mutate(client, {
            mutation: PROPOSE_SHIFT,
            variables: {
              proposedShiftId: selectedShift.id,
              shiftId: clickedShift.id
            }
          }).then(result => {
            console.log(result.data.createShiftConnection.shiftConnection);
            notifications.success("Shift Request Sent");
            requestingShiftConnection = false;
          });
        } catch (error) {
          notifications.danger("Something went wrong! Please try again.");
          console.log(error);
          requestingShiftConnection = false;
        }
      }

      //   $: getShifts.refetch({ companyId: selectedCompanyId }).then(result => {
      //     shifts.set(result);
      //     //console.log($shifts);
      //   });

      //   $: if (Object.getOwnPropertyNames(selectedCompany) === 0) {
      //     console.log(selectedCompany.company.id);
      //   }

      function handleClickedShift(shift, ul) {
        if (requestingShiftConnection === true) {
          notifications.info("A Shift Request is in progress!");
          return;
        }

        if (showing === true && clickedShift.id === shift.id) {
          $$invalidate('showing', showing = false);
          $$invalidate('clickedShift', clickedShift = null);
          popoverWrapper.style.display = "none"; $$invalidate('popoverWrapper', popoverWrapper);
          return;
        }

        $$invalidate('showing', showing = false);
        $$invalidate('selectedShift', selectedShift = null);
        popoverWrapper.style.display = "inline-block"; $$invalidate('popoverWrapper', popoverWrapper);

        let contentRect = content.getBoundingClientRect();
        let ulRect = ul.getBoundingClientRect();
        let popoverContentRect = popoverWrapper.firstChild.getBoundingClientRect();

        popoverX = ulRect.width / 2 - popoverContentRect.width / 2;
        popoverY = ulRect.top - contentRect.height + window.scrollY;
        popoverWrapper.style.left = popoverX + "px"; $$invalidate('popoverWrapper', popoverWrapper);
        popoverWrapper.style.top = popoverY + "px"; $$invalidate('popoverWrapper', popoverWrapper);

        $$invalidate('clickedShift', clickedShift = shift);

        setTimeout(() => {
          $$invalidate('showing', showing = true);
        }, 1);
      }

      onMount(() => {
        if ($user.isCompany) {
          selectedCompanyId = $user.id;
          fetchShifts();
        }
      });

    	function select_change_handler() {
    		selectedCompany = select_value(this);
    		$$invalidate('selectedCompany', selectedCompany);
    	}

    	function ul_binding($$value, i) {
    		if (uls[i] === $$value) return;
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			uls[i] = $$value;
    			$$invalidate('uls', uls);
    		});
    	}

    	function click_handler({ shift, i }) {
    	            handleClickedShift(shift, uls[i]);
    	          }

    	function select_change_handler_1() {
    		selectedShift = select_value(this);
    		$$invalidate('selectedShift', selectedShift);
    		$$invalidate('myShifts', myShifts);
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('popoverWrapper', popoverWrapper = $$value);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('content', content = $$value);
    		});
    	}

    	return {
    		myShifts,
    		selectedShift,
    		clickedShift,
    		showing,
    		selectedCompany,
    		popoverWrapper,
    		content,
    		uls,
    		fetchShiftsFromInput,
    		proposeShift,
    		handleClickedShift,
    		$shifts,
    		$user,
    		$connections,
    		$menuDisplayed,
    		select_change_handler,
    		ul_binding,
    		click_handler,
    		select_change_handler_1,
    		div1_binding,
    		div2_binding
    	};
    }

    class Shifts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$d, safe_not_equal, []);
    	}
    }

    const getCalendarPage = (month, year, dayProps) => {
      let date = new Date(year, month, 1);
      date.setDate(date.getDate() - date.getDay());
      let nextMonth = month === 11 ? 0 : month + 1;
      // ensure days starts on Sunday
      // and end on saturday
      let weeks = [];
      while (date.getMonth() !== nextMonth || date.getDay() !== 0 || weeks.length !== 6) {
        if (date.getDay() === 0) weeks.unshift({ days: [], id: `${year}${month}${year}${weeks.length}` });
        weeks[0].days.push({
          partOfMonth: date.getMonth() === month,
          date: new Date(date),
          ...dayProps(date)
        });
        date.setDate(date.getDate() + 1);
      }
      weeks.reverse();
      return { month, year, weeks };
    };

    const getDayPropsHandler = (start, end, selectableCallback) => {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      return date => ({
        selectable: date >= start && date <= end
         && (!selectableCallback || selectableCallback(date)),
        isToday: date.getTime() === today.getTime()
      });
    };

    function getMonths(start, end, selectableCallback = null) {
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      let endDate = new Date(end.getFullYear(), end.getMonth() + 1, 1);
      let months = [];
      let date = new Date(start.getFullYear(), start.getMonth(), 1);
      let dayPropsHandler = getDayPropsHandler(start, end, selectableCallback);
      while (date < endDate) {
        months.push(getCalendarPage(date.getMonth(), date.getFullYear(), dayPropsHandler));
        date.setMonth(date.getMonth() + 1);
      }
      return months;
    }

    const areDatesEquivalent = (a, b) => a.getDate() === b.getDate()
      && a.getMonth() === b.getMonth()
      && a.getFullYear() === b.getFullYear();

    /* node_modules\svelte-calendar\src\Components\Week.svelte generated by Svelte v3.6.7 */

    const file$b = "node_modules\\svelte-calendar\\src\\Components\\Week.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.day = list[i];
    	return child_ctx;
    }

    // (22:2) {#each days as day}
    function create_each_block$4(ctx) {
    	var div, button, t0_value = ctx.day.date.getDate(), t0, t1, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(button, "class", "day--label svelte-7mtl66");
    			attr(button, "type", "button");
    			toggle_class(button, "selected", areDatesEquivalent(ctx.day.date, ctx.selected));
    			toggle_class(button, "highlighted", areDatesEquivalent(ctx.day.date, ctx.highlighted));
    			toggle_class(button, "shake-date", ctx.shouldShakeDate && areDatesEquivalent(ctx.day.date, ctx.shouldShakeDate));
    			toggle_class(button, "disabled", !ctx.day.selectable);
    			add_location(button, file$b, 28, 6, 678);
    			attr(div, "class", "day svelte-7mtl66");
    			toggle_class(div, "outside-month", !ctx.day.partOfMonth);
    			toggle_class(div, "is-today", ctx.day.isToday);
    			toggle_class(div, "is-disabled", !ctx.day.selectable);
    			add_location(div, file$b, 22, 4, 519);
    			dispose = listen(button, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    			append(button, t0);
    			append(div, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.days) && t0_value !== (t0_value = ctx.day.date.getDate())) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.areDatesEquivalent || changed.days || changed.selected)) {
    				toggle_class(button, "selected", areDatesEquivalent(ctx.day.date, ctx.selected));
    			}

    			if ((changed.areDatesEquivalent || changed.days || changed.highlighted)) {
    				toggle_class(button, "highlighted", areDatesEquivalent(ctx.day.date, ctx.highlighted));
    			}

    			if ((changed.shouldShakeDate || changed.areDatesEquivalent || changed.days)) {
    				toggle_class(button, "shake-date", ctx.shouldShakeDate && areDatesEquivalent(ctx.day.date, ctx.shouldShakeDate));
    			}

    			if (changed.days) {
    				toggle_class(button, "disabled", !ctx.day.selectable);
    				toggle_class(div, "outside-month", !ctx.day.partOfMonth);
    				toggle_class(div, "is-today", ctx.day.isToday);
    				toggle_class(div, "is-disabled", !ctx.day.selectable);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	var div, div_intro, div_outro, current;

    	var each_value = ctx.days;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div, "class", "week svelte-7mtl66");
    			add_location(div, file$b, 16, 0, 379);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.days || changed.areDatesEquivalent || changed.selected || changed.highlighted || changed.shouldShakeDate) {
    				each_value = ctx.days;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { x: ctx.direction * 50, duration: 180, delay: 90 });
    				div_intro.start();
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fade, { duration: 180 });

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				if (div_outro) div_outro.end();
    			}
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	

      const dispatch = createEventDispatcher();

      let { days, selected, start, end, highlighted, shouldShakeDate, direction } = $$props;

    	const writable_props = ['days', 'selected', 'start', 'end', 'highlighted', 'shouldShakeDate', 'direction'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Week> was created with unknown prop '${key}'`);
    	});

    	function click_handler({ day }) {
    		return dispatch('dateSelected', day.date);
    	}

    	$$self.$set = $$props => {
    		if ('days' in $$props) $$invalidate('days', days = $$props.days);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('start' in $$props) $$invalidate('start', start = $$props.start);
    		if ('end' in $$props) $$invalidate('end', end = $$props.end);
    		if ('highlighted' in $$props) $$invalidate('highlighted', highlighted = $$props.highlighted);
    		if ('shouldShakeDate' in $$props) $$invalidate('shouldShakeDate', shouldShakeDate = $$props.shouldShakeDate);
    		if ('direction' in $$props) $$invalidate('direction', direction = $$props.direction);
    	};

    	return {
    		dispatch,
    		days,
    		selected,
    		start,
    		end,
    		highlighted,
    		shouldShakeDate,
    		direction,
    		click_handler
    	};
    }

    class Week extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$e, safe_not_equal, ["days", "selected", "start", "end", "highlighted", "shouldShakeDate", "direction"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.days === undefined && !('days' in props)) {
    			console.warn("<Week> was created without expected prop 'days'");
    		}
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Week> was created without expected prop 'selected'");
    		}
    		if (ctx.start === undefined && !('start' in props)) {
    			console.warn("<Week> was created without expected prop 'start'");
    		}
    		if (ctx.end === undefined && !('end' in props)) {
    			console.warn("<Week> was created without expected prop 'end'");
    		}
    		if (ctx.highlighted === undefined && !('highlighted' in props)) {
    			console.warn("<Week> was created without expected prop 'highlighted'");
    		}
    		if (ctx.shouldShakeDate === undefined && !('shouldShakeDate' in props)) {
    			console.warn("<Week> was created without expected prop 'shouldShakeDate'");
    		}
    		if (ctx.direction === undefined && !('direction' in props)) {
    			console.warn("<Week> was created without expected prop 'direction'");
    		}
    	}

    	get days() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set days(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlighted() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlighted(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shouldShakeDate() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shouldShakeDate(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-calendar\src\Components\Month.svelte generated by Svelte v3.6.7 */

    const file$c = "node_modules\\svelte-calendar\\src\\Components\\Month.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.week = list[i];
    	return child_ctx;
    }

    // (22:2) {#each visibleMonth.weeks as week (week.id) }
    function create_each_block$5(key_1, ctx) {
    	var first, current;

    	var week = new Week({
    		props: {
    		days: ctx.week.days,
    		selected: ctx.selected,
    		start: ctx.start,
    		end: ctx.end,
    		highlighted: ctx.highlighted,
    		shouldShakeDate: ctx.shouldShakeDate,
    		direction: ctx.direction
    	},
    		$$inline: true
    	});
    	week.$on("dateSelected", ctx.dateSelected_handler);

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			first = empty();
    			week.$$.fragment.c();
    			this.first = first;
    		},

    		m: function mount(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(week, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var week_changes = {};
    			if (changed.visibleMonth) week_changes.days = ctx.week.days;
    			if (changed.selected) week_changes.selected = ctx.selected;
    			if (changed.start) week_changes.start = ctx.start;
    			if (changed.end) week_changes.end = ctx.end;
    			if (changed.highlighted) week_changes.highlighted = ctx.highlighted;
    			if (changed.shouldShakeDate) week_changes.shouldShakeDate = ctx.shouldShakeDate;
    			if (changed.direction) week_changes.direction = ctx.direction;
    			week.$set(week_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(week.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(week.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(first);
    			}

    			destroy_component(week, detaching);
    		}
    	};
    }

    function create_fragment$f(ctx) {
    	var div, each_blocks = [], each_1_lookup = new Map(), current;

    	var each_value = ctx.visibleMonth.weeks;

    	const get_key = ctx => ctx.week.id;

    	for (var i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$5(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$5(key, child_ctx));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
    			attr(div, "class", "month-container svelte-ny3kda");
    			add_location(div, file$c, 20, 0, 322);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			const each_value = ctx.visibleMonth.weeks;

    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$5, null, get_each_context$5);
    			check_outros();
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			for (i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { id, visibleMonth, selected, start, end, highlighted, shouldShakeDate } = $$props;

      let lastId = id;
      let direction;

    	const writable_props = ['id', 'visibleMonth', 'selected', 'start', 'end', 'highlighted', 'shouldShakeDate'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Month> was created with unknown prop '${key}'`);
    	});

    	function dateSelected_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('visibleMonth' in $$props) $$invalidate('visibleMonth', visibleMonth = $$props.visibleMonth);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('start' in $$props) $$invalidate('start', start = $$props.start);
    		if ('end' in $$props) $$invalidate('end', end = $$props.end);
    		if ('highlighted' in $$props) $$invalidate('highlighted', highlighted = $$props.highlighted);
    		if ('shouldShakeDate' in $$props) $$invalidate('shouldShakeDate', shouldShakeDate = $$props.shouldShakeDate);
    	};

    	$$self.$$.update = ($$dirty = { lastId: 1, id: 1 }) => {
    		if ($$dirty.lastId || $$dirty.id) { {
            $$invalidate('direction', direction = lastId < id ? 1 : -1);
            $$invalidate('lastId', lastId = id);
          } }
    	};

    	return {
    		id,
    		visibleMonth,
    		selected,
    		start,
    		end,
    		highlighted,
    		shouldShakeDate,
    		direction,
    		dateSelected_handler
    	};
    }

    class Month extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$f, safe_not_equal, ["id", "visibleMonth", "selected", "start", "end", "highlighted", "shouldShakeDate"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Month> was created without expected prop 'id'");
    		}
    		if (ctx.visibleMonth === undefined && !('visibleMonth' in props)) {
    			console.warn("<Month> was created without expected prop 'visibleMonth'");
    		}
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Month> was created without expected prop 'selected'");
    		}
    		if (ctx.start === undefined && !('start' in props)) {
    			console.warn("<Month> was created without expected prop 'start'");
    		}
    		if (ctx.end === undefined && !('end' in props)) {
    			console.warn("<Month> was created without expected prop 'end'");
    		}
    		if (ctx.highlighted === undefined && !('highlighted' in props)) {
    			console.warn("<Month> was created without expected prop 'highlighted'");
    		}
    		if (ctx.shouldShakeDate === undefined && !('shouldShakeDate' in props)) {
    			console.warn("<Month> was created without expected prop 'shouldShakeDate'");
    		}
    	}

    	get id() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visibleMonth() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visibleMonth(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlighted() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlighted(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shouldShakeDate() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shouldShakeDate(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const monthDict = [
      { name: 'January', abbrev: 'Jan' },
      { name: 'February', abbrev: 'Feb' },
      { name: 'March', abbrev: 'Mar' },
      { name: 'April', abbrev: 'Apr' },
      { name: 'May', abbrev: 'May' },
      { name: 'June', abbrev: 'Jun' },
      { name: 'July', abbrev: 'Jul' },
      { name: 'August', abbrev: 'Aug' },
      { name: 'September', abbrev: 'Sep' },
      { name: 'October', abbrev: 'Oct' },
      { name: 'November', abbrev: 'Nov' },
      { name: 'December', abbrev: 'Dec' }
    ];

    const dayDict = [
      { name: 'Sunday', abbrev: 'Sun' },
      { name: 'Monday', abbrev: 'Mon' },
      { name: 'Tuesday', abbrev: 'Tue' },
      { name: 'Wednesday', abbrev: 'Wed' },
      { name: 'Thursday', abbrev: 'Thu' },
      { name: 'Friday', abbrev: 'Fri' },
      { name: 'Saturday', abbrev: 'Sat' }
    ];

    /* node_modules\svelte-calendar\src\Components\NavBar.svelte generated by Svelte v3.6.7 */

    const file$d = "node_modules\\svelte-calendar\\src\\Components\\NavBar.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.monthDefinition = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (61:4) {#each availableMonths as monthDefinition, index}
    function create_each_block$6(ctx) {
    	var div, span, t0_value = ctx.monthDefinition.abbrev, t0, t1, dispose;

    	function click_handler_2(...args) {
    		return ctx.click_handler_2(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(span, "class", "svelte-gfrd1b");
    			add_location(span, file$d, 67, 8, 1841);
    			attr(div, "class", "month-selector--month svelte-gfrd1b");
    			toggle_class(div, "selected", ctx.index === ctx.month);
    			toggle_class(div, "selectable", ctx.monthDefinition.selectable);
    			add_location(div, file$d, 61, 6, 1637);
    			dispose = listen(div, "click", click_handler_2);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, span);
    			append(span, t0);
    			append(div, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.availableMonths) && t0_value !== (t0_value = ctx.monthDefinition.abbrev)) {
    				set_data(t0, t0_value);
    			}

    			if (changed.month) {
    				toggle_class(div, "selected", ctx.index === ctx.month);
    			}

    			if (changed.availableMonths) {
    				toggle_class(div, "selectable", ctx.monthDefinition.selectable);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$g(ctx) {
    	var div5, div3, div0, i0, t0, div1, t1_value = monthDict[ctx.month].name, t1, t2, t3, t4, div2, i1, t5, div4, dispose;

    	var each_value = ctx.availableMonths;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(ctx.year);
    			t4 = space();
    			div2 = element("div");
    			i1 = element("i");
    			t5 = space();
    			div4 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(i0, "class", "arrow left svelte-gfrd1b");
    			add_location(i0, file$d, 48, 6, 1196);
    			attr(div0, "class", "control svelte-gfrd1b");
    			toggle_class(div0, "enabled", ctx.canDecrementMonth);
    			add_location(div0, file$d, 45, 4, 1073);
    			attr(div1, "class", "label svelte-gfrd1b");
    			add_location(div1, file$d, 50, 4, 1238);
    			attr(i1, "class", "arrow right svelte-gfrd1b");
    			add_location(i1, file$d, 56, 6, 1467);
    			attr(div2, "class", "control svelte-gfrd1b");
    			toggle_class(div2, "enabled", ctx.canIncrementMonth);
    			add_location(div2, file$d, 53, 4, 1346);
    			attr(div3, "class", "heading-section svelte-gfrd1b");
    			add_location(div3, file$d, 44, 2, 1039);
    			attr(div4, "class", "month-selector svelte-gfrd1b");
    			toggle_class(div4, "open", ctx.monthSelectorOpen);
    			add_location(div4, file$d, 59, 2, 1517);
    			attr(div5, "class", "title");
    			add_location(div5, file$d, 43, 0, 1017);

    			dispose = [
    				listen(div0, "click", ctx.click_handler),
    				listen(div1, "click", ctx.toggleMonthSelectorOpen),
    				listen(div2, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div3);
    			append(div3, div0);
    			append(div0, i0);
    			append(div3, t0);
    			append(div3, div1);
    			append(div1, t1);
    			append(div1, t2);
    			append(div1, t3);
    			append(div3, t4);
    			append(div3, div2);
    			append(div2, i1);
    			append(div5, t5);
    			append(div5, div4);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.canDecrementMonth) {
    				toggle_class(div0, "enabled", ctx.canDecrementMonth);
    			}

    			if ((changed.month) && t1_value !== (t1_value = monthDict[ctx.month].name)) {
    				set_data(t1, t1_value);
    			}

    			if (changed.year) {
    				set_data(t3, ctx.year);
    			}

    			if (changed.canIncrementMonth) {
    				toggle_class(div2, "enabled", ctx.canIncrementMonth);
    			}

    			if (changed.month || changed.availableMonths) {
    				each_value = ctx.availableMonths;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.monthSelectorOpen) {
    				toggle_class(div4, "open", ctx.monthSelectorOpen);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div5);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	

      const dispatch = createEventDispatcher();

      let { month, start, end, year, canIncrementMonth, canDecrementMonth } = $$props;

      let monthSelectorOpen = false;
      let availableMonths;

      function toggleMonthSelectorOpen() {
        $$invalidate('monthSelectorOpen', monthSelectorOpen = !monthSelectorOpen);
      }

      function monthSelected(event, m) {
        event.stopPropagation();
        dispatch('monthSelected', m);
        toggleMonthSelectorOpen();
      }

    	const writable_props = ['month', 'start', 'end', 'year', 'canIncrementMonth', 'canDecrementMonth'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		return dispatch('incrementMonth', -1);
    	}

    	function click_handler_1() {
    		return dispatch('incrementMonth', 1);
    	}

    	function click_handler_2({ index }, e) {
    		return monthSelected(e, index);
    	}

    	$$self.$set = $$props => {
    		if ('month' in $$props) $$invalidate('month', month = $$props.month);
    		if ('start' in $$props) $$invalidate('start', start = $$props.start);
    		if ('end' in $$props) $$invalidate('end', end = $$props.end);
    		if ('year' in $$props) $$invalidate('year', year = $$props.year);
    		if ('canIncrementMonth' in $$props) $$invalidate('canIncrementMonth', canIncrementMonth = $$props.canIncrementMonth);
    		if ('canDecrementMonth' in $$props) $$invalidate('canDecrementMonth', canDecrementMonth = $$props.canDecrementMonth);
    	};

    	$$self.$$.update = ($$dirty = { start: 1, year: 1, end: 1 }) => {
    		if ($$dirty.start || $$dirty.year || $$dirty.end) { {
            let isOnLowerBoundary = start.getFullYear() === year;
            let isOnUpperBoundary = end.getFullYear() === year;
            $$invalidate('availableMonths', availableMonths = monthDict.map((m, i) => {
              return {
                ...m,
                selectable:
                  (!isOnLowerBoundary && !isOnUpperBoundary)
                || (
                  (!isOnLowerBoundary || i >= start.getMonth())
                  && (!isOnUpperBoundary || i <= end.getMonth())
                )
              };
            }));
          } }
    	};

    	return {
    		dispatch,
    		month,
    		start,
    		end,
    		year,
    		canIncrementMonth,
    		canDecrementMonth,
    		monthSelectorOpen,
    		availableMonths,
    		toggleMonthSelectorOpen,
    		monthSelected,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	};
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$g, safe_not_equal, ["month", "start", "end", "year", "canIncrementMonth", "canDecrementMonth"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.month === undefined && !('month' in props)) {
    			console.warn("<NavBar> was created without expected prop 'month'");
    		}
    		if (ctx.start === undefined && !('start' in props)) {
    			console.warn("<NavBar> was created without expected prop 'start'");
    		}
    		if (ctx.end === undefined && !('end' in props)) {
    			console.warn("<NavBar> was created without expected prop 'end'");
    		}
    		if (ctx.year === undefined && !('year' in props)) {
    			console.warn("<NavBar> was created without expected prop 'year'");
    		}
    		if (ctx.canIncrementMonth === undefined && !('canIncrementMonth' in props)) {
    			console.warn("<NavBar> was created without expected prop 'canIncrementMonth'");
    		}
    		if (ctx.canDecrementMonth === undefined && !('canDecrementMonth' in props)) {
    			console.warn("<NavBar> was created without expected prop 'canDecrementMonth'");
    		}
    	}

    	get month() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get year() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get canIncrementMonth() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canIncrementMonth(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get canDecrementMonth() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canDecrementMonth(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-calendar\src\Components\Popover.svelte generated by Svelte v3.6.7 */
    const { window: window_1 } = globals;

    const file$e = "node_modules\\svelte-calendar\\src\\Components\\Popover.svelte";

    const get_contents_slot_changes = () => ({});
    const get_contents_slot_context = () => ({});

    const get_trigger_slot_changes = () => ({});
    const get_trigger_slot_context = () => ({});

    function create_fragment$h(ctx) {
    	var div4, div0, t, div3, div2, div1, current, dispose;

    	add_render_callback(ctx.onwindowresize);

    	const trigger_slot_1 = ctx.$$slots.trigger;
    	const trigger_slot = create_slot(trigger_slot_1, ctx, get_trigger_slot_context);

    	const contents_slot_1 = ctx.$$slots.contents;
    	const contents_slot = create_slot(contents_slot_1, ctx, get_contents_slot_context);

    	return {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");

    			if (trigger_slot) trigger_slot.c();
    			t = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");

    			if (contents_slot) contents_slot.c();

    			attr(div0, "class", "trigger");
    			add_location(div0, file$e, 102, 2, 2323);

    			attr(div1, "class", "contents-inner svelte-1abig9l");
    			add_location(div1, file$e, 113, 6, 2710);
    			attr(div2, "class", "contents svelte-1abig9l");
    			add_location(div2, file$e, 112, 4, 2652);
    			attr(div3, "class", "contents-wrapper svelte-1abig9l");
    			set_style(div3, "transform", "translate(-50%,-50%) translate(" + ctx.translateX + "px, " + ctx.translateY + "px)");
    			toggle_class(div3, "visible", ctx.open);
    			toggle_class(div3, "shrink", ctx.shrink);
    			add_location(div3, file$e, 106, 2, 2441);
    			attr(div4, "class", "popover svelte-1abig9l");
    			add_location(div4, file$e, 101, 0, 2279);

    			dispose = [
    				listen(window_1, "resize", ctx.onwindowresize),
    				listen(div0, "click", ctx.doOpen)
    			];
    		},

    		l: function claim(nodes) {
    			if (trigger_slot) trigger_slot.l(div0_nodes);

    			if (contents_slot) contents_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div0);

    			if (trigger_slot) {
    				trigger_slot.m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			append(div4, t);
    			append(div4, div3);
    			append(div3, div2);
    			append(div2, div1);

    			if (contents_slot) {
    				contents_slot.m(div1, null);
    			}

    			ctx.div2_binding(div2);
    			ctx.div3_binding(div3);
    			ctx.div4_binding(div4);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (trigger_slot && trigger_slot.p && changed.$$scope) {
    				trigger_slot.p(get_slot_changes(trigger_slot_1, ctx, changed, get_trigger_slot_changes), get_slot_context(trigger_slot_1, ctx, get_trigger_slot_context));
    			}

    			if (contents_slot && contents_slot.p && changed.$$scope) {
    				contents_slot.p(get_slot_changes(contents_slot_1, ctx, changed, get_contents_slot_changes), get_slot_context(contents_slot_1, ctx, get_contents_slot_context));
    			}

    			if (!current || changed.translateX || changed.translateY) {
    				set_style(div3, "transform", "translate(-50%,-50%) translate(" + ctx.translateX + "px, " + ctx.translateY + "px)");
    			}

    			if (changed.open) {
    				toggle_class(div3, "visible", ctx.open);
    			}

    			if (changed.shrink) {
    				toggle_class(div3, "shrink", ctx.shrink);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(trigger_slot, local);
    			transition_in(contents_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(trigger_slot, local);
    			transition_out(contents_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}

    			if (trigger_slot) trigger_slot.d(detaching);
    			ctx.div0_binding(null);

    			if (contents_slot) contents_slot.d(detaching);
    			ctx.div2_binding(null);
    			ctx.div3_binding(null);
    			ctx.div4_binding(null);
    			run_all(dispose);
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

      let once = (el, evt, cb) => {
        function handler() {
          cb.apply(this, arguments);
          el.removeEventListener(evt, handler);
        }
        el.addEventListener(evt, handler);
      };

      let popover;
      let w;
      let triggerContainer;
      let contentsAnimated;
      let contentsWrapper;
      let translateY = 0;
      let translateX = 0;

      let { open = false, shrink, trigger } = $$props;
      const close = () => {
        $$invalidate('shrink', shrink = true);
        once(contentsAnimated, 'animationend', () => {
          $$invalidate('shrink', shrink = false);
          $$invalidate('open', open = false);
          dispatch('closed');
        });
      };

      function checkForFocusLoss(evt) {
        if (!open) return;
        let el = evt.target;
        // eslint-disable-next-line
        do {
          if (el === popover) return;
        } while (el = el.parentNode);
        close();
      }

      onMount(() => {
        document.addEventListener('click', checkForFocusLoss);
        if (!trigger) return;
        triggerContainer.appendChild(trigger.parentNode.removeChild(trigger));

        // eslint-disable-next-line
        return () => {
          document.removeEventListener('click', checkForFocusLoss);
        };
      });

      const getDistanceToEdges = async () => {
        if (!open) { $$invalidate('open', open = true); }
        await tick();
        let rect = contentsWrapper.getBoundingClientRect();
        return {
          top: rect.top + (-1 * translateY),
          bottom: window.innerHeight - rect.bottom + translateY,
          left: rect.left + (-1 * translateX),
          right: document.body.clientWidth - rect.right + translateX
        };
      };

      const getTranslate = async () => {
        let dist = await getDistanceToEdges();
        let x; let
          y;
        if (w < 480) {
          y = dist.bottom;
        } else if (dist.top < 0) {
          y = Math.abs(dist.top);
        } else if (dist.bottom < 0) {
          y = dist.bottom;
        } else {
          y = 0;
        }
        if (dist.left < 0) {
          x = Math.abs(dist.left);
        } else if (dist.right < 0) {
          x = dist.right;
        } else {
          x = 0;
        }
        return { x, y };
      };

      const doOpen = async () => {
        const { x, y } = await getTranslate();

        $$invalidate('translateX', translateX = x);
        $$invalidate('translateY', translateY = y);
        $$invalidate('open', open = true);

        dispatch('opened');
      };

    	const writable_props = ['open', 'shrink', 'trigger'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Popover> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function onwindowresize() {
    		w = window_1.innerWidth; $$invalidate('w', w);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('triggerContainer', triggerContainer = $$value);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('contentsAnimated', contentsAnimated = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('contentsWrapper', contentsWrapper = $$value);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('popover', popover = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('open' in $$props) $$invalidate('open', open = $$props.open);
    		if ('shrink' in $$props) $$invalidate('shrink', shrink = $$props.shrink);
    		if ('trigger' in $$props) $$invalidate('trigger', trigger = $$props.trigger);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		popover,
    		w,
    		triggerContainer,
    		contentsAnimated,
    		contentsWrapper,
    		translateY,
    		translateX,
    		open,
    		shrink,
    		trigger,
    		close,
    		doOpen,
    		onwindowresize,
    		div0_binding,
    		div2_binding,
    		div3_binding,
    		div4_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Popover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$h, safe_not_equal, ["open", "shrink", "trigger", "close"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.shrink === undefined && !('shrink' in props)) {
    			console.warn("<Popover> was created without expected prop 'shrink'");
    		}
    		if (ctx.trigger === undefined && !('trigger' in props)) {
    			console.warn("<Popover> was created without expected prop 'trigger'");
    		}
    	}

    	get open() {
    		throw new Error("<Popover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Popover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shrink() {
    		throw new Error("<Popover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shrink(value) {
    		throw new Error("<Popover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trigger() {
    		throw new Error("<Popover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trigger(value) {
    		throw new Error("<Popover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx.close;
    	}

    	set close(value) {
    		throw new Error("<Popover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const keyCodes = {
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      pgup: 33,
      pgdown: 34,
      enter: 13,
      escape: 27,
      tab: 9
    };

    const keyCodesArray = Object.keys(keyCodes).map(k => keyCodes[k]);

    /* node_modules\svelte-calendar\src\Components\Datepicker.svelte generated by Svelte v3.6.7 */

    const file$f = "node_modules\\svelte-calendar\\src\\Components\\Datepicker.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.day = list[i];
    	return child_ctx;
    }

    // (202:8) {#if !trigger}
    function create_if_block$3(ctx) {
    	var button, t;

    	return {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.formattedSelected);
    			attr(button, "class", "calendar-button svelte-1kuaxoc");
    			attr(button, "type", "button");
    			add_location(button, file$f, 202, 8, 5384);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.formattedSelected) {
    				set_data(t, ctx.formattedSelected);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}
    		}
    	};
    }

    // (200:4) <div slot="trigger">
    function create_trigger_slot(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	var if_block = (!ctx.trigger) && create_if_block$3(ctx);

    	return {
    		c: function create() {
    			div = element("div");

    			if (!default_slot) {
    				if (if_block) if_block.c();
    			}

    			if (default_slot) default_slot.c();

    			attr(div, "slot", "trigger");
    			attr(div, "class", "svelte-1kuaxoc");
    			add_location(div, file$f, 199, 4, 5319);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (!default_slot) {
    				if (if_block) if_block.m(div, null);
    			}

    			else {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!default_slot) {
    				if (!ctx.trigger) {
    					if (if_block) {
    						if_block.p(changed, ctx);
    					} else {
    						if_block = create_if_block$3(ctx);
    						if_block.c();
    						if_block.m(div, null);
    					}
    				} else if (if_block) {
    					if_block.d(1);
    					if_block = null;
    				}
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (!default_slot) {
    				if (if_block) if_block.d();
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (215:10) {#each dayDict as day}
    function create_each_block$7(ctx) {
    	var span, t_value = ctx.day.abbrev, t;

    	return {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr(span, "class", "svelte-1kuaxoc");
    			add_location(span, file$f, 215, 10, 5845);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}
    		}
    	};
    }

    // (209:4) <div slot="contents">
    function create_contents_slot(ctx) {
    	var div0, div2, t0, div1, t1, current;

    	var navbar = new NavBar({
    		props: {
    		month: ctx.month,
    		year: ctx.year,
    		start: ctx.start,
    		end: ctx.end,
    		canIncrementMonth: ctx.canIncrementMonth,
    		canDecrementMonth: ctx.canDecrementMonth
    	},
    		$$inline: true
    	});
    	navbar.$on("monthSelected", ctx.monthSelected_handler);
    	navbar.$on("incrementMonth", ctx.incrementMonth_handler);

    	var each_value = dayDict;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	var month_1 = new Month({
    		props: {
    		visibleMonth: ctx.visibleMonth,
    		selected: ctx.selected,
    		highlighted: ctx.highlighted,
    		shouldShakeDate: ctx.shouldShakeDate,
    		start: ctx.start,
    		end: ctx.end,
    		id: ctx.visibleMonthId
    	},
    		$$inline: true
    	});
    	month_1.$on("dateSelected", ctx.dateSelected_handler);

    	return {
    		c: function create() {
    			div0 = element("div");
    			div2 = element("div");
    			navbar.$$.fragment.c();
    			t0 = space();
    			div1 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			month_1.$$.fragment.c();
    			attr(div1, "class", "legend svelte-1kuaxoc");
    			add_location(div1, file$f, 213, 8, 5781);
    			attr(div2, "class", "calendar svelte-1kuaxoc");
    			add_location(div2, file$f, 209, 6, 5550);
    			attr(div0, "slot", "contents");
    			attr(div0, "class", "svelte-1kuaxoc");
    			add_location(div0, file$f, 208, 4, 5522);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, div2);
    			mount_component(navbar, div2, null);
    			append(div2, t0);
    			append(div2, div1);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append(div2, t1);
    			mount_component(month_1, div2, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navbar_changes = {};
    			if (changed.month) navbar_changes.month = ctx.month;
    			if (changed.year) navbar_changes.year = ctx.year;
    			if (changed.start) navbar_changes.start = ctx.start;
    			if (changed.end) navbar_changes.end = ctx.end;
    			if (changed.canIncrementMonth) navbar_changes.canIncrementMonth = ctx.canIncrementMonth;
    			if (changed.canDecrementMonth) navbar_changes.canDecrementMonth = ctx.canDecrementMonth;
    			navbar.$set(navbar_changes);

    			if (changed.dayDict) {
    				each_value = dayDict;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			var month_1_changes = {};
    			if (changed.visibleMonth) month_1_changes.visibleMonth = ctx.visibleMonth;
    			if (changed.selected) month_1_changes.selected = ctx.selected;
    			if (changed.highlighted) month_1_changes.highlighted = ctx.highlighted;
    			if (changed.shouldShakeDate) month_1_changes.shouldShakeDate = ctx.shouldShakeDate;
    			if (changed.start) month_1_changes.start = ctx.start;
    			if (changed.end) month_1_changes.end = ctx.end;
    			if (changed.visibleMonthId) month_1_changes.id = ctx.visibleMonthId;
    			month_1.$set(month_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);

    			transition_in(month_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(month_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    			}

    			destroy_component(navbar, );

    			destroy_each(each_blocks, detaching);

    			destroy_component(month_1, );
    		}
    	};
    }

    // (192:2) <Popover     bind:this="{popover}"     bind:open="{isOpen}"     bind:shrink="{isClosing}"     {trigger}     on:opened="{registerOpen}"     on:closed="{registerClose}"   >
    function create_default_slot(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$i(ctx) {
    	var div, updating_open, updating_shrink, current;

    	function popover_1_open_binding(value) {
    		ctx.popover_1_open_binding.call(null, value);
    		updating_open = true;
    		add_flush_callback(() => updating_open = false);
    	}

    	function popover_1_shrink_binding(value_1) {
    		ctx.popover_1_shrink_binding.call(null, value_1);
    		updating_shrink = true;
    		add_flush_callback(() => updating_shrink = false);
    	}

    	let popover_1_props = {
    		trigger: ctx.trigger,
    		$$slots: {
    		default: [create_default_slot],
    		contents: [create_contents_slot],
    		trigger: [create_trigger_slot]
    	},
    		$$scope: { ctx }
    	};
    	if (ctx.isOpen !== void 0) {
    		popover_1_props.open = ctx.isOpen;
    	}
    	if (ctx.isClosing !== void 0) {
    		popover_1_props.shrink = ctx.isClosing;
    	}
    	var popover_1 = new Popover({ props: popover_1_props, $$inline: true });

    	ctx.popover_1_binding(popover_1);
    	binding_callbacks.push(() => bind(popover_1, 'open', popover_1_open_binding));
    	binding_callbacks.push(() => bind(popover_1, 'shrink', popover_1_shrink_binding));
    	popover_1.$on("opened", ctx.registerOpen);
    	popover_1.$on("closed", ctx.registerClose);

    	return {
    		c: function create() {
    			div = element("div");
    			popover_1.$$.fragment.c();
    			attr(div, "class", "datepicker svelte-1kuaxoc");
    			toggle_class(div, "open", ctx.isOpen);
    			toggle_class(div, "closing", ctx.isClosing);
    			add_location(div, file$f, 190, 0, 5067);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(popover_1, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var popover_1_changes = {};
    			if (changed.trigger) popover_1_changes.trigger = ctx.trigger;
    			if (changed.$$scope || changed.visibleMonth || changed.selected || changed.highlighted || changed.shouldShakeDate || changed.start || changed.end || changed.visibleMonthId || changed.month || changed.year || changed.canIncrementMonth || changed.canDecrementMonth || changed.trigger || changed.formattedSelected) popover_1_changes.$$scope = { changed, ctx };
    			if (!updating_open && changed.isOpen) {
    				popover_1_changes.open = ctx.isOpen;
    			}
    			if (!updating_shrink && changed.isClosing) {
    				popover_1_changes.shrink = ctx.isClosing;
    			}
    			popover_1.$set(popover_1_changes);

    			if (changed.isOpen) {
    				toggle_class(div, "open", ctx.isOpen);
    			}

    			if (changed.isClosing) {
    				toggle_class(div, "closing", ctx.isClosing);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(popover_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(popover_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			ctx.popover_1_binding(null);

    			destroy_component(popover_1, );
    		}
    	};
    }

    function getDay(m, date) {
      for (let i = 0; i < m.weeks.length; i += 1) {
        for (let j = 0; j < m.weeks[i].days.length; j += 1) {
          if (areDatesEquivalent(m.weeks[i].days[j].date, date)) {
            return m.weeks[i].days[j];
          }
        }
      }
      return null;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	

      const dispatch = createEventDispatcher();
      const today = new Date();

      let popover;

      let { format = '#{m}/#{d}/#{Y}', start = new Date(1987, 9, 29), end = new Date(2020, 9, 29), selected = today, dateChosen = false, trigger = null, selectableCallback = null } = $$props;

      let highlighted = today;
      let shouldShakeDate = false;
      let shakeHighlightTimeout;
      let month = today.getMonth();
      let year = today.getFullYear();

      let isOpen = false;
      let isClosing = false;

      today.setHours(0, 0, 0, 0);

      function assignmentHandler(formatted) {
        if (!trigger) return;
        trigger.innerHTML = formatted; $$invalidate('trigger', trigger);
      }

      let monthIndex = 0;

      let { formattedSelected } = $$props;

      onMount(() => {
        $$invalidate('month', month = selected.getMonth());
        $$invalidate('year', year = selected.getFullYear());
      });

      function changeMonth(selectedMonth) {
        $$invalidate('month', month = selectedMonth);
      }

      function incrementMonth(direction, date) {
        if (direction === 1 && !canIncrementMonth) return;
        if (direction === -1 && !canDecrementMonth) return;
        let current = new Date(year, month, 1);
        current.setMonth(current.getMonth() + direction);
        $$invalidate('month', month = current.getMonth());
        $$invalidate('year', year = current.getFullYear());
        $$invalidate('highlighted', highlighted = new Date(year, month, date || 1));
      }

      function getDefaultHighlighted() {
        return new Date(selected);
      }

      function incrementDayHighlighted(amount) {
        $$invalidate('highlighted', highlighted = new Date(highlighted));
        highlighted.setDate(highlighted.getDate() + amount);
        if (amount > 0 && highlighted > lastVisibleDate) {
          return incrementMonth(1, highlighted.getDate());
        }
        if (amount < 0 && highlighted < firstVisibleDate) {
          return incrementMonth(-1, highlighted.getDate());
        }
        return highlighted;
      }

      function checkIfVisibleDateIsSelectable(date) {
        const day = getDay(visibleMonth, date);
        if (!day) return false;
        return day.selectable;
      }

      function shakeDate(date) {
        clearTimeout(shakeHighlightTimeout);
        $$invalidate('shouldShakeDate', shouldShakeDate = date);
        shakeHighlightTimeout = setTimeout(() => {
          $$invalidate('shouldShakeDate', shouldShakeDate = false);
        }, 700);
      }

      function assignValueToTrigger(formatted) {
        assignmentHandler(formatted);
      }

      function registerSelection(chosen) {
        if (!checkIfVisibleDateIsSelectable(chosen)) return shakeDate(chosen);
        // eslint-disable-next-line
        close();
        $$invalidate('selected', selected = chosen);
        $$invalidate('dateChosen', dateChosen = true);
        assignValueToTrigger(formattedSelected);
        return dispatch('dateSelected', { date: chosen });
      }

      function handleKeyPress(evt) {
        if (keyCodesArray.indexOf(evt.keyCode) === -1) return;
        evt.preventDefault();
        switch (evt.keyCode) {
          case keyCodes.left:
            incrementDayHighlighted(-1);
            break;
          case keyCodes.up:
            incrementDayHighlighted(-7);
            break;
          case keyCodes.right:
            incrementDayHighlighted(1);
            break;
          case keyCodes.down:
            incrementDayHighlighted(7);
            break;
          case keyCodes.pgup:
            incrementMonth(-1);
            break;
          case keyCodes.pgdown:
            incrementMonth(1);
            break;
          case keyCodes.escape:
            // eslint-disable-next-line
            close();
            break;
          case keyCodes.enter:
            registerSelection(highlighted);
            break;
          default:
            break;
        }
      }

      function registerClose() {
        document.removeEventListener('keydown', handleKeyPress);
        dispatch('close');
      }

      function close() {
        popover.close();
        registerClose();
      }

      function registerOpen() {
        $$invalidate('highlighted', highlighted = getDefaultHighlighted());
        $$invalidate('month', month = selected.getMonth());
        $$invalidate('year', year = selected.getFullYear());
        document.addEventListener('keydown', handleKeyPress);
        dispatch('open');
      }

    	const writable_props = ['format', 'start', 'end', 'selected', 'dateChosen', 'trigger', 'selectableCallback', 'formattedSelected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Datepicker> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function monthSelected_handler(e) {
    		return changeMonth(e.detail);
    	}

    	function incrementMonth_handler(e) {
    		return incrementMonth(e.detail);
    	}

    	function dateSelected_handler(e) {
    		return registerSelection(e.detail);
    	}

    	function popover_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('popover', popover = $$value);
    		});
    	}

    	function popover_1_open_binding(value) {
    		isOpen = value;
    		$$invalidate('isOpen', isOpen);
    	}

    	function popover_1_shrink_binding(value_1) {
    		isClosing = value_1;
    		$$invalidate('isClosing', isClosing);
    	}

    	$$self.$set = $$props => {
    		if ('format' in $$props) $$invalidate('format', format = $$props.format);
    		if ('start' in $$props) $$invalidate('start', start = $$props.start);
    		if ('end' in $$props) $$invalidate('end', end = $$props.end);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('dateChosen' in $$props) $$invalidate('dateChosen', dateChosen = $$props.dateChosen);
    		if ('trigger' in $$props) $$invalidate('trigger', trigger = $$props.trigger);
    		if ('selectableCallback' in $$props) $$invalidate('selectableCallback', selectableCallback = $$props.selectableCallback);
    		if ('formattedSelected' in $$props) $$invalidate('formattedSelected', formattedSelected = $$props.formattedSelected);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	let months, visibleMonth, visibleMonthId, lastVisibleDate, firstVisibleDate, canIncrementMonth, canDecrementMonth;

    	$$self.$$.update = ($$dirty = { start: 1, end: 1, selectableCallback: 1, months: 1, month: 1, year: 1, monthIndex: 1, visibleMonth: 1, selected: 1, format: 1 }) => {
    		if ($$dirty.start || $$dirty.end || $$dirty.selectableCallback) { $$invalidate('months', months = getMonths(start, end, selectableCallback)); }
    		if ($$dirty.months || $$dirty.month || $$dirty.year) { {
            $$invalidate('monthIndex', monthIndex = 0);
            for (let i = 0; i < months.length; i += 1) {
              if (months[i].month === month && months[i].year === year) {
                $$invalidate('monthIndex', monthIndex = i);
              }
            }
          } }
    		if ($$dirty.months || $$dirty.monthIndex) { $$invalidate('visibleMonth', visibleMonth = months[monthIndex]); }
    		if ($$dirty.year || $$dirty.month) { $$invalidate('visibleMonthId', visibleMonthId = year + month / 100); }
    		if ($$dirty.visibleMonth) { lastVisibleDate = visibleMonth.weeks[visibleMonth.weeks.length - 1].days[6].date; }
    		if ($$dirty.visibleMonth) { firstVisibleDate = visibleMonth.weeks[0].days[0].date; }
    		if ($$dirty.monthIndex || $$dirty.months) { $$invalidate('canIncrementMonth', canIncrementMonth = monthIndex < months.length - 1); }
    		if ($$dirty.monthIndex) { $$invalidate('canDecrementMonth', canDecrementMonth = monthIndex > 0); }
    		if ($$dirty.selected || $$dirty.format) { {
            $$invalidate('formattedSelected', formattedSelected = formatDate(selected, format));
          } }
    	};

    	return {
    		popover,
    		format,
    		start,
    		end,
    		selected,
    		dateChosen,
    		trigger,
    		selectableCallback,
    		highlighted,
    		shouldShakeDate,
    		month,
    		year,
    		isOpen,
    		isClosing,
    		formattedSelected,
    		changeMonth,
    		incrementMonth,
    		registerSelection,
    		registerClose,
    		registerOpen,
    		visibleMonth,
    		visibleMonthId,
    		canIncrementMonth,
    		canDecrementMonth,
    		monthSelected_handler,
    		incrementMonth_handler,
    		dateSelected_handler,
    		popover_1_binding,
    		popover_1_open_binding,
    		popover_1_shrink_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Datepicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$i, safe_not_equal, ["format", "start", "end", "selected", "dateChosen", "trigger", "selectableCallback", "formattedSelected"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.formattedSelected === undefined && !('formattedSelected' in props)) {
    			console.warn("<Datepicker> was created without expected prop 'formattedSelected'");
    		}
    	}

    	get format() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dateChosen() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dateChosen(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trigger() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trigger(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectableCallback() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectableCallback(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formattedSelected() {
    		throw new Error("<Datepicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formattedSelected(value) {
    		throw new Error("<Datepicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\dashboard\PostShift.svelte generated by Svelte v3.6.7 */

    const file$g = "src\\dashboard\\PostShift.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.choice = list[i];
    	return child_ctx;
    }

    // (238:4) {:else}
    function create_else_block_4(ctx) {
    	var div, h5;

    	return {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "You are not a member of any company yet, please request an invite from\r\n          your company's admin to start swapping shifts with your colleagues.";
    			add_location(h5, file$g, 239, 8, 7173);
    			add_location(div, file$g, 238, 6, 7158);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h5);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (123:4) {#if $connections.length > 0}
    function create_if_block$4(ctx) {
    	var div5, form, div0, h50, t1, updating_formattedSelected, updating_dateChosen, t2, select0, t3, select1, t4, div1, h51, t6, updating_formattedSelected_1, updating_dateChosen_1, t7, select2, t8, select3, t9, div2, h52, t11, textarea, t12, div3, h53, t14, select4, option, t16, div4, button, current, dispose;

    	function datepicker0_formattedSelected_binding(value) {
    		ctx.datepicker0_formattedSelected_binding.call(null, value);
    		updating_formattedSelected = true;
    		add_flush_callback(() => updating_formattedSelected = false);
    	}

    	function datepicker0_dateChosen_binding(value_1) {
    		ctx.datepicker0_dateChosen_binding.call(null, value_1);
    		updating_dateChosen = true;
    		add_flush_callback(() => updating_dateChosen = false);
    	}

    	let datepicker0_props = {
    		format: dateFormat$2,
    		start: ctx.fromCalendarStartDate,
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};
    	if (ctx.fromDate !== void 0) {
    		datepicker0_props.formattedSelected = ctx.fromDate;
    	}
    	if (ctx.fromDateChosen !== void 0) {
    		datepicker0_props.dateChosen = ctx.fromDateChosen;
    	}
    	var datepicker0 = new Datepicker({ props: datepicker0_props, $$inline: true });

    	binding_callbacks.push(() => bind(datepicker0, 'formattedSelected', datepicker0_formattedSelected_binding));
    	binding_callbacks.push(() => bind(datepicker0, 'dateChosen', datepicker0_dateChosen_binding));
    	datepicker0.$on("open", ctx.open_handler);
    	datepicker0.$on("close", ctx.close_handler);

    	var each_value_4 = ctx.hourList;

    	var each_blocks_4 = [];

    	for (var i_1 = 0; i_1 < each_value_4.length; i_1 += 1) {
    		each_blocks_4[i_1] = create_each_block_4(get_each_context_4(ctx, each_value_4, i_1));
    	}

    	var each_value_3 = ctx.minuteList;

    	var each_blocks_3 = [];

    	for (var i_1 = 0; i_1 < each_value_3.length; i_1 += 1) {
    		each_blocks_3[i_1] = create_each_block_3(get_each_context_3(ctx, each_value_3, i_1));
    	}

    	function datepicker1_formattedSelected_binding(value_2) {
    		ctx.datepicker1_formattedSelected_binding.call(null, value_2);
    		updating_formattedSelected_1 = true;
    		add_flush_callback(() => updating_formattedSelected_1 = false);
    	}

    	function datepicker1_dateChosen_binding(value_3) {
    		ctx.datepicker1_dateChosen_binding.call(null, value_3);
    		updating_dateChosen_1 = true;
    		add_flush_callback(() => updating_dateChosen_1 = false);
    	}

    	let datepicker1_props = {
    		format: dateFormat$2,
    		start: ctx.toCalendarStartDate,
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};
    	if (ctx.toDate !== void 0) {
    		datepicker1_props.formattedSelected = ctx.toDate;
    	}
    	if (ctx.toDateChosen !== void 0) {
    		datepicker1_props.dateChosen = ctx.toDateChosen;
    	}
    	var datepicker1 = new Datepicker({ props: datepicker1_props, $$inline: true });

    	binding_callbacks.push(() => bind(datepicker1, 'formattedSelected', datepicker1_formattedSelected_binding));
    	binding_callbacks.push(() => bind(datepicker1, 'dateChosen', datepicker1_dateChosen_binding));

    	var each_value_2 = ctx.hourList;

    	var each_blocks_2 = [];

    	for (var i_1 = 0; i_1 < each_value_2.length; i_1 += 1) {
    		each_blocks_2[i_1] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i_1));
    	}

    	var each_value_1 = ctx.minuteList;

    	var each_blocks_1 = [];

    	for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
    		each_blocks_1[i_1] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i_1));
    	}

    	var each_value = ctx.$connections;

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block$8(get_each_context$8(ctx, each_value, i_1));
    	}

    	return {
    		c: function create() {
    			div5 = element("div");
    			form = element("form");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = "From :";
    			t1 = space();
    			datepicker0.$$.fragment.c();
    			t2 = space();
    			select0 = element("select");

    			for (var i_1 = 0; i_1 < each_blocks_4.length; i_1 += 1) {
    				each_blocks_4[i_1].c();
    			}

    			t3 = space();
    			select1 = element("select");

    			for (var i_1 = 0; i_1 < each_blocks_3.length; i_1 += 1) {
    				each_blocks_3[i_1].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			h51 = element("h5");
    			h51.textContent = "To :";
    			t6 = space();
    			datepicker1.$$.fragment.c();
    			t7 = space();
    			select2 = element("select");

    			for (var i_1 = 0; i_1 < each_blocks_2.length; i_1 += 1) {
    				each_blocks_2[i_1].c();
    			}

    			t8 = space();
    			select3 = element("select");

    			for (var i_1 = 0; i_1 < each_blocks_1.length; i_1 += 1) {
    				each_blocks_1[i_1].c();
    			}

    			t9 = space();
    			div2 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Note :";
    			t11 = space();
    			textarea = element("textarea");
    			t12 = space();
    			div3 = element("div");
    			h53 = element("h5");
    			h53.textContent = "Company :";
    			t14 = space();
    			select4 = element("select");
    			option = element("option");
    			option.textContent = "Select Company to post shift on\r\n              ";

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			t16 = space();
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "Post Shift";
    			add_location(h50, file$g, 126, 12, 3305);
    			if (ctx.fromHour === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
    			attr(select0, "aria-describedby", "inputGroupSelect01");
    			attr(select0, "class", "custom-select time-field svelte-1pvagza");
    			add_location(select0, file$g, 146, 12, 3954);
    			if (ctx.fromMinute === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
    			attr(select1, "aria-describedby", "inputGroupSelect01");
    			attr(select1, "class", "custom-select time-field svelte-1pvagza");
    			add_location(select1, file$g, 156, 12, 4336);
    			attr(div0, "class", "");
    			add_location(div0, file$g, 125, 10, 3277);
    			add_location(h51, file$g, 168, 12, 4766);
    			if (ctx.toHour === void 0) add_render_callback(() => ctx.select2_change_handler.call(select2));
    			attr(select2, "aria-describedby", "inputGroupSelect01");
    			attr(select2, "class", "custom-select time-field svelte-1pvagza");
    			add_location(select2, file$g, 183, 12, 5292);
    			if (ctx.toMinute === void 0) add_render_callback(() => ctx.select3_change_handler.call(select3));
    			attr(select3, "aria-describedby", "inputGroupSelect01");
    			attr(select3, "class", "custom-select time-field svelte-1pvagza");
    			add_location(select3, file$g, 193, 12, 5672);
    			attr(div1, "class", "");
    			add_location(div1, file$g, 167, 10, 4738);
    			add_location(h52, file$g, 205, 12, 6100);
    			attr(textarea, "class", "form-control");
    			attr(textarea, "name", "note");
    			attr(textarea, "id", "note");
    			attr(textarea, "cols", "");
    			attr(textarea, "rows", "");
    			attr(textarea, "placeholder", "Enter a short note about this shift");
    			add_location(textarea, file$g, 206, 12, 6129);
    			attr(div2, "class", "");
    			add_location(div2, file$g, 204, 10, 6072);
    			add_location(h53, file$g, 216, 12, 6435);
    			option.__value = "";
    			option.value = option.__value;
    			option.selected = true;
    			option.disabled = true;
    			option.hidden = true;
    			add_location(option, file$g, 218, 14, 6542);
    			if (ctx.selectedCompany === void 0) add_render_callback(() => ctx.select4_change_handler.call(select4));
    			attr(select4, "class", "custom-select");
    			add_location(select4, file$g, 217, 12, 6467);
    			attr(div3, "class", "mb-3");
    			add_location(div3, file$g, 215, 10, 6403);
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary form-control postShift-btn svelte-1pvagza");
    			add_location(button, file$g, 229, 12, 6936);
    			attr(div4, "class", "");
    			add_location(div4, file$g, 228, 10, 6908);
    			attr(form, "class", "");
    			add_location(form, file$g, 124, 8, 3210);
    			attr(div5, "class", "jumbotron svelte-1pvagza");
    			add_location(div5, file$g, 123, 6, 3177);

    			dispose = [
    				listen(select0, "change", ctx.select0_change_handler),
    				listen(select1, "change", ctx.select1_change_handler),
    				listen(select2, "change", ctx.select2_change_handler),
    				listen(select3, "change", ctx.select3_change_handler),
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(select4, "change", ctx.select4_change_handler),
    				listen(form, "submit", prevent_default(ctx.handleSubmit))
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, form);
    			append(form, div0);
    			append(div0, h50);
    			append(div0, t1);
    			mount_component(datepicker0, div0, null);
    			append(div0, t2);
    			append(div0, select0);

    			for (var i_1 = 0; i_1 < each_blocks_4.length; i_1 += 1) {
    				each_blocks_4[i_1].m(select0, null);
    			}

    			select_option(select0, ctx.fromHour);

    			append(div0, t3);
    			append(div0, select1);

    			for (var i_1 = 0; i_1 < each_blocks_3.length; i_1 += 1) {
    				each_blocks_3[i_1].m(select1, null);
    			}

    			select_option(select1, ctx.fromMinute);

    			append(form, t4);
    			append(form, div1);
    			append(div1, h51);
    			append(div1, t6);
    			mount_component(datepicker1, div1, null);
    			append(div1, t7);
    			append(div1, select2);

    			for (var i_1 = 0; i_1 < each_blocks_2.length; i_1 += 1) {
    				each_blocks_2[i_1].m(select2, null);
    			}

    			select_option(select2, ctx.toHour);

    			append(div1, t8);
    			append(div1, select3);

    			for (var i_1 = 0; i_1 < each_blocks_1.length; i_1 += 1) {
    				each_blocks_1[i_1].m(select3, null);
    			}

    			select_option(select3, ctx.toMinute);

    			append(form, t9);
    			append(form, div2);
    			append(div2, h52);
    			append(div2, t11);
    			append(div2, textarea);

    			textarea.value = ctx.note;

    			append(form, t12);
    			append(form, div3);
    			append(div3, h53);
    			append(div3, t14);
    			append(div3, select4);
    			append(select4, option);

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(select4, null);
    			}

    			select_option(select4, ctx.selectedCompany);

    			append(form, t16);
    			append(form, div4);
    			append(div4, button);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var datepicker0_changes = {};
    			if (changed.dateFormat) datepicker0_changes.format = dateFormat$2;
    			if (changed.fromCalendarStartDate) datepicker0_changes.start = ctx.fromCalendarStartDate;
    			if (changed.$$scope || changed.fromDate) datepicker0_changes.$$scope = { changed, ctx };
    			if (!updating_formattedSelected && changed.fromDate) {
    				datepicker0_changes.formattedSelected = ctx.fromDate;
    			}
    			if (!updating_dateChosen && changed.fromDateChosen) {
    				datepicker0_changes.dateChosen = ctx.fromDateChosen;
    			}
    			datepicker0.$set(datepicker0_changes);

    			if (changed.hourList) {
    				each_value_4 = ctx.hourList;

    				for (var i_1 = 0; i_1 < each_value_4.length; i_1 += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i_1);

    					if (each_blocks_4[i_1]) {
    						each_blocks_4[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks_4[i_1] = create_each_block_4(child_ctx);
    						each_blocks_4[i_1].c();
    						each_blocks_4[i_1].m(select0, null);
    					}
    				}

    				for (; i_1 < each_blocks_4.length; i_1 += 1) {
    					each_blocks_4[i_1].d(1);
    				}
    				each_blocks_4.length = each_value_4.length;
    			}

    			if (changed.fromHour) select_option(select0, ctx.fromHour);

    			if (changed.minuteList) {
    				each_value_3 = ctx.minuteList;

    				for (var i_1 = 0; i_1 < each_value_3.length; i_1 += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i_1);

    					if (each_blocks_3[i_1]) {
    						each_blocks_3[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks_3[i_1] = create_each_block_3(child_ctx);
    						each_blocks_3[i_1].c();
    						each_blocks_3[i_1].m(select1, null);
    					}
    				}

    				for (; i_1 < each_blocks_3.length; i_1 += 1) {
    					each_blocks_3[i_1].d(1);
    				}
    				each_blocks_3.length = each_value_3.length;
    			}

    			if (changed.fromMinute) select_option(select1, ctx.fromMinute);

    			var datepicker1_changes = {};
    			if (changed.dateFormat) datepicker1_changes.format = dateFormat$2;
    			if (changed.toCalendarStartDate) datepicker1_changes.start = ctx.toCalendarStartDate;
    			if (changed.$$scope || changed.fromClicked || changed.toDate) datepicker1_changes.$$scope = { changed, ctx };
    			if (!updating_formattedSelected_1 && changed.toDate) {
    				datepicker1_changes.formattedSelected = ctx.toDate;
    			}
    			if (!updating_dateChosen_1 && changed.toDateChosen) {
    				datepicker1_changes.dateChosen = ctx.toDateChosen;
    			}
    			datepicker1.$set(datepicker1_changes);

    			if (changed.hourList) {
    				each_value_2 = ctx.hourList;

    				for (var i_1 = 0; i_1 < each_value_2.length; i_1 += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i_1);

    					if (each_blocks_2[i_1]) {
    						each_blocks_2[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks_2[i_1] = create_each_block_2$1(child_ctx);
    						each_blocks_2[i_1].c();
    						each_blocks_2[i_1].m(select2, null);
    					}
    				}

    				for (; i_1 < each_blocks_2.length; i_1 += 1) {
    					each_blocks_2[i_1].d(1);
    				}
    				each_blocks_2.length = each_value_2.length;
    			}

    			if (changed.toHour) select_option(select2, ctx.toHour);

    			if (changed.minuteList) {
    				each_value_1 = ctx.minuteList;

    				for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i_1);

    					if (each_blocks_1[i_1]) {
    						each_blocks_1[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i_1] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i_1].c();
    						each_blocks_1[i_1].m(select3, null);
    					}
    				}

    				for (; i_1 < each_blocks_1.length; i_1 += 1) {
    					each_blocks_1[i_1].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.toMinute) select_option(select3, ctx.toMinute);
    			if (changed.note) textarea.value = ctx.note;

    			if (changed.$connections) {
    				each_value = ctx.$connections;

    				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks[i_1] = create_each_block$8(child_ctx);
    						each_blocks[i_1].c();
    						each_blocks[i_1].m(select4, null);
    					}
    				}

    				for (; i_1 < each_blocks.length; i_1 += 1) {
    					each_blocks[i_1].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selectedCompany) select_option(select4, ctx.selectedCompany);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker0.$$.fragment, local);

    			transition_in(datepicker1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(datepicker0.$$.fragment, local);
    			transition_out(datepicker1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div5);
    			}

    			destroy_component(datepicker0, );

    			destroy_each(each_blocks_4, detaching);

    			destroy_each(each_blocks_3, detaching);

    			destroy_component(datepicker1, );

    			destroy_each(each_blocks_2, detaching);

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    // (128:12) <Datepicker                format={dateFormat}                start={fromCalendarStartDate}                bind:formattedSelected={fromDate}                bind:dateChosen={fromDateChosen}                on:open={() => {                  fromClicked = true;                }}                on:close={() => {                  fromClicked = false;                }}>
    function create_default_slot_1(ctx) {
    	var input;

    	return {
    		c: function create() {
    			input = element("input");
    			attr(input, "type", "text");
    			attr(input, "class", "form-control date-field svelte-1pvagza");
    			input.value = ctx.fromDate;
    			input.readOnly = true;
    			attr(input, "placeholder", "Pick a start date");
    			add_location(input, file$g, 138, 14, 3715);
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.fromDate) {
    				input.value = ctx.fromDate;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    			}
    		}
    	};
    }

    // (153:44) {:else}
    function create_else_block_3$1(ctx) {
    	var t_value = ctx.choice, t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.hourList) && t_value !== (t_value = ctx.choice)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (153:18) {#if choice < 10}
    function create_if_block_5$1(ctx) {
    	var t0, t1_value = ctx.choice, t1;

    	return {
    		c: function create() {
    			t0 = text("0");
    			t1 = text(t1_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.hourList) && t1_value !== (t1_value = ctx.choice)) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (151:14) {#each hourList as choice}
    function create_each_block_4(ctx) {
    	var option, t, option_value_value;

    	function select_block_type_1(ctx) {
    		if (ctx.choice < 10) return create_if_block_5$1;
    		return create_else_block_3$1;
    	}

    	var current_block_type = select_block_type_1(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			option = element("option");
    			if_block.c();
    			t = space();
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$g, 151, 16, 4160);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			if_block.m(option, null);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(option, t);
    				}
    			}

    			if ((changed.hourList) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}

    			if_block.d();
    		}
    	};
    }

    // (163:44) {:else}
    function create_else_block_2$1(ctx) {
    	var t_value = ctx.choice, t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.minuteList) && t_value !== (t_value = ctx.choice)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (163:18) {#if choice < 10}
    function create_if_block_4$1(ctx) {
    	var t0, t1_value = ctx.choice, t1;

    	return {
    		c: function create() {
    			t0 = text("0");
    			t1 = text(t1_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.minuteList) && t1_value !== (t1_value = ctx.choice)) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (161:14) {#each minuteList as choice}
    function create_each_block_3(ctx) {
    	var option, t, option_value_value;

    	function select_block_type_2(ctx) {
    		if (ctx.choice < 10) return create_if_block_4$1;
    		return create_else_block_2$1;
    	}

    	var current_block_type = select_block_type_2(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			option = element("option");
    			if_block.c();
    			t = space();
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$g, 161, 16, 4546);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			if_block.m(option, null);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(option, t);
    				}
    			}

    			if ((changed.minuteList) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}

    			if_block.d();
    		}
    	};
    }

    // (175:14) {#if !fromClicked}
    function create_if_block_3$1(ctx) {
    	var input;

    	return {
    		c: function create() {
    			input = element("input");
    			attr(input, "type", "text");
    			attr(input, "class", "form-control date-field svelte-1pvagza");
    			input.value = ctx.toDate;
    			input.readOnly = true;
    			attr(input, "placeholder", "Pick a end date");
    			add_location(input, file$g, 175, 16, 5028);
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.toDate) {
    				input.value = ctx.toDate;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    			}
    		}
    	};
    }

    // (170:12) <Datepicker                format={dateFormat}                start={toCalendarStartDate}                bind:formattedSelected={toDate}                bind:dateChosen={toDateChosen}>
    function create_default_slot$1(ctx) {
    	var if_block_anchor;

    	var if_block = (!ctx.fromClicked) && create_if_block_3$1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.fromClicked) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (190:44) {:else}
    function create_else_block_1$1(ctx) {
    	var t_value = ctx.choice, t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.hourList) && t_value !== (t_value = ctx.choice)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (190:18) {#if choice < 10}
    function create_if_block_2$1(ctx) {
    	var t0, t1_value = ctx.choice, t1;

    	return {
    		c: function create() {
    			t0 = text("0");
    			t1 = text(t1_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.hourList) && t1_value !== (t1_value = ctx.choice)) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (188:14) {#each hourList as choice}
    function create_each_block_2$1(ctx) {
    	var option, t, option_value_value;

    	function select_block_type_3(ctx) {
    		if (ctx.choice < 10) return create_if_block_2$1;
    		return create_else_block_1$1;
    	}

    	var current_block_type = select_block_type_3(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			option = element("option");
    			if_block.c();
    			t = space();
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$g, 188, 16, 5496);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			if_block.m(option, null);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(option, t);
    				}
    			}

    			if ((changed.hourList) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}

    			if_block.d();
    		}
    	};
    }

    // (200:44) {:else}
    function create_else_block$3(ctx) {
    	var t_value = ctx.choice, t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.minuteList) && t_value !== (t_value = ctx.choice)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (200:18) {#if choice < 10}
    function create_if_block_1$2(ctx) {
    	var t0, t1_value = ctx.choice, t1;

    	return {
    		c: function create() {
    			t0 = text("0");
    			t1 = text(t1_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.minuteList) && t1_value !== (t1_value = ctx.choice)) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (198:14) {#each minuteList as choice}
    function create_each_block_1$1(ctx) {
    	var option, t, option_value_value;

    	function select_block_type_4(ctx) {
    		if (ctx.choice < 10) return create_if_block_1$2;
    		return create_else_block$3;
    	}

    	var current_block_type = select_block_type_4(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			option = element("option");
    			if_block.c();
    			t = space();
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$g, 198, 16, 5880);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			if_block.m(option, null);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(option, t);
    				}
    			}

    			if ((changed.minuteList) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}

    			if_block.d();
    		}
    	};
    }

    // (222:14) {#each $connections as choice}
    function create_each_block$8(ctx) {
    	var option, t0_value = ctx.choice.company.userprofile.companyName, t0, t1, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = ctx.choice;
    			option.value = option.__value;
    			add_location(option, file$g, 222, 16, 6722);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			append(option, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$connections) && t0_value !== (t0_value = ctx.choice.company.userprofile.companyName)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.$connections) && option_value_value !== (option_value_value = ctx.choice)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$j(ctx) {
    	var div, main, current_block_type_index, if_block, div_intro, current;

    	var if_block_creators = [
    		create_if_block$4,
    		create_else_block_4
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.$connections.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			main = element("main");
    			if_block.c();
    			attr(main, "class", "svelte-1pvagza");
    			add_location(main, file$g, 121, 2, 3128);
    			add_location(div, file$g, 120, 0, 3091);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, main);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 500 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    let dateFormat$2 = "#{l}, #{F} #{j}, #{Y}";

    function instance$g($$self, $$props, $$invalidate) {
    	let $myShifts, $connections;

    	validate_store(myShifts, 'myShifts');
    	subscribe($$self, myShifts, $$value => { $myShifts = $$value; $$invalidate('$myShifts', $myShifts); });
    	validate_store(connections, 'connections');
    	subscribe($$self, connections, $$value => { $connections = $$value; $$invalidate('$connections', $connections); });

    	

      const client = getClient();

      let fromTime;
      let toTime;
      let note = "";
      let isSponsored = false;
      let companyId;
      let selectedCompany;
      let fromDate = formatDate(new Date(), dateFormat$2);
      let toDate = formatDate(new Date(), dateFormat$2);
      let fromCalendarStartDate = new Date();
      let toCalendarStartDate = new Date();
      let toCalendarEndDate = new Date();
      let fromHour = 0;
      let toHour = 0;
      let fromMinute = 0;
      let toMinute = 0;
      let hourList = new Array(24);
      let minuteList = new Array(60);
      let fromClicked = false;
      let fromDateChosen = false;
      let toDateChosen = false;

      for (var i = 0; i < hourList.length; i++) {
        hourList[i] = i; $$invalidate('hourList', hourList);
      }

      for (var i = 0; i < minuteList.length; i++) {
        minuteList[i] = i; $$invalidate('minuteList', minuteList);
      }

      // toCalendarStartDate = formatDate(toCalendarStartDate, dateFormat);
      // fromCalendarStartDate = formatDate(fromCalendarStartDate, dateFormat);

      async function postShift() {
        try {
          await mutate(client, {
            mutation: POST_SHIFT,
            variables: {
              fromTime: fromTime,
              toTime: toTime,
              note: note,
              isSponsored: isSponsored,
              companyId: companyId
            }
          }).then(result => {
            $myShifts = [...$myShifts, result.data.createShift.shift]; myShifts.set($myShifts);
            console.log($myShifts);
          });
        } catch (error) {
          console.log(error);
        }
      }

      async function handleSubmit() {
        if (!selectedCompany) {
          notifications.danger("You must select a company to proceed");
          return;
        }

        fromTime = new Date(fromDate + ", " + fromHour + ":" + fromMinute);
        toTime = new Date(toDate + ", " + toHour + ":" + toMinute);

        if (fromTime >= toTime) {
          notifications.danger("Shift end date must be higher than start date");
          return;
        }

        companyId = selectedCompany.company.id;
        isSponsored = false;

        postShift();

        // console.log("From: " + fromTime);
        // console.log("To: " + toTime);
        // console.log(note);
        // console.log(companyId);
      }

    	function datepicker0_formattedSelected_binding(value) {
    		fromDate = value;
    		$$invalidate('fromDate', fromDate);
    	}

    	function datepicker0_dateChosen_binding(value_1) {
    		fromDateChosen = value_1;
    		$$invalidate('fromDateChosen', fromDateChosen);
    	}

    	function open_handler() {
    	                fromClicked = true; $$invalidate('fromClicked', fromClicked);
    	              }

    	function close_handler() {
    	                fromClicked = false; $$invalidate('fromClicked', fromClicked);
    	              }

    	function select0_change_handler() {
    		fromHour = select_value(this);
    		$$invalidate('fromHour', fromHour);
    		$$invalidate('hourList', hourList);
    	}

    	function select1_change_handler() {
    		fromMinute = select_value(this);
    		$$invalidate('fromMinute', fromMinute);
    		$$invalidate('minuteList', minuteList);
    	}

    	function datepicker1_formattedSelected_binding(value_2) {
    		toDate = value_2;
    		$$invalidate('toDate', toDate), $$invalidate('fromDate', fromDate);
    	}

    	function datepicker1_dateChosen_binding(value_3) {
    		toDateChosen = value_3;
    		$$invalidate('toDateChosen', toDateChosen);
    	}

    	function select2_change_handler() {
    		toHour = select_value(this);
    		$$invalidate('toHour', toHour);
    		$$invalidate('hourList', hourList);
    	}

    	function select3_change_handler() {
    		toMinute = select_value(this);
    		$$invalidate('toMinute', toMinute);
    		$$invalidate('minuteList', minuteList);
    	}

    	function textarea_input_handler() {
    		note = this.value;
    		$$invalidate('note', note);
    	}

    	function select4_change_handler() {
    		selectedCompany = select_value(this);
    		$$invalidate('selectedCompany', selectedCompany);
    	}

    	$$self.$$.update = ($$dirty = { fromDate: 1, toCalendarEndDate: 1, toCalendarStartDate: 1 }) => {
    		if ($$dirty.fromDate) { $$invalidate('toDate', toDate = fromDate); }
    		if ($$dirty.fromDate || $$dirty.toCalendarEndDate || $$dirty.toCalendarStartDate) { {
            $$invalidate('toCalendarStartDate', toCalendarStartDate = new Date(fromDate));
            toCalendarEndDate.setDate(toCalendarStartDate.getDate() + 1);
            // toCalendarEndDate = toCalendarEndDate;
          } }
    	};

    	return {
    		note,
    		selectedCompany,
    		fromDate,
    		toDate,
    		fromCalendarStartDate,
    		toCalendarStartDate,
    		fromHour,
    		toHour,
    		fromMinute,
    		toMinute,
    		hourList,
    		minuteList,
    		fromClicked,
    		fromDateChosen,
    		toDateChosen,
    		handleSubmit,
    		$connections,
    		datepicker0_formattedSelected_binding,
    		datepicker0_dateChosen_binding,
    		open_handler,
    		close_handler,
    		select0_change_handler,
    		select1_change_handler,
    		datepicker1_formattedSelected_binding,
    		datepicker1_dateChosen_binding,
    		select2_change_handler,
    		select3_change_handler,
    		textarea_input_handler,
    		select4_change_handler
    	};
    }

    class PostShift extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$j, safe_not_equal, []);
    	}
    }

    /* src\dashboard\DashBoard.svelte generated by Svelte v3.6.7 */

    const file$h = "src\\dashboard\\DashBoard.svelte";

    function create_fragment$k(ctx) {
    	var div, div_intro;

    	return {
    		c: function create() {
    			div = element("div");
    			attr(div, "class", "svelte-4qciy9");
    			add_location(div, file$h, 62, 0, 1489);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		p: noop,

    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 500 });
    					div_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function instance$h($$self) {
    	

      const client = getClient();

      const getUser = query(client, {
        query: GET_USER
      });

      const getConnections = query(client, {
        query: GET_CONNECTIONS
      });

      onMount(async () => {
        // Set timeout only for testing
        push("/dashboard/shifts");
      });

    	return {};
    }

    class DashBoard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$k, safe_not_equal, []);
    	}
    }

    /* src\ConfirmInvitation.svelte generated by Svelte v3.6.7 */
    const { console: console_1$1 } = globals;

    const file$i = "src\\ConfirmInvitation.svelte";

    function create_fragment$l(ctx) {
    	var main, div, p, t;

    	return {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			p = element("p");
    			t = text(ctx.label);
    			add_location(p, file$i, 73, 4, 1956);
    			attr(div, "class", "card");
    			add_location(div, file$i, 72, 2, 1932);
    			add_location(main, file$i, 71, 0, 1922);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div);
    			append(div, p);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data(t, ctx.label);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}
    		}
    	};
    }

    function timeout(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function pushToLogin(ms, msg) {
      notifications.danger(msg, ms);
      await timeout(ms);
      push("/login");
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $isLoggedIn;

    	validate_store(isLoggedIn, 'isLoggedIn');
    	subscribe($$self, isLoggedIn, $$value => { $isLoggedIn = $$value; $$invalidate('$isLoggedIn', $isLoggedIn); });

    	

      let { params = {} } = $$props;

      const client = getClient();

      let label = "Confirming invitation, please wait...";

      async function confirmInvitation() {
        try {
          await mutate(client, {
            mutation: CONFIRM_INVITATION,
            variables: { invitationId: params.id }
          }).then(result => {
            $$invalidate('label', label = "Congratulation, invitation confirmed!");
            let msg =
              "You have successfully joined " +
              result.data.confirmUserConnection.userConnection.company.userprofile
                .companyName;
            if (result.data.confirmUserConnection.userConnection.isConfirmed) {
              notifications.success(msg);
            }
            setTimeout(() => {
              push("/dashboard/");
            }, 3500);
          });
        } catch (error) {
          console.log(error);
          $$invalidate('label', label = "An error occurred");
          notifications.danger(label, 1500);
          setTimeout(() => {
            push("/dashboard/");
          }, 1800);
        }
      }
      // console.log(params.id);

      onMount(async () => {
        await timeout(3000);

        if ($isLoggedIn === false) {
          var msg = "You are not Logged in, redirecting to the log in page...";
          await pushToLogin(2000, msg);
        } else {
          confirmInvitation();
        }
      });

    	const writable_props = ['params'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$1.warn(`<ConfirmInvitation> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('params' in $$props) $$invalidate('params', params = $$props.params);
    	};

    	return { params, label };
    }

    class ConfirmInvitation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$l, safe_not_equal, ["params"]);
    	}

    	get params() {
    		throw new Error("<ConfirmInvitation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ConfirmInvitation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\NotFound.svelte generated by Svelte v3.6.7 */

    const file$j = "src\\NotFound.svelte";

    function create_fragment$m(ctx) {
    	var div, h1, div_intro;

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "404 Error: Page Not Found";
    			attr(h1, "class", "svelte-ysidjt");
    			add_location(h1, file$j, 11, 2, 164);
    			add_location(div, file$j, 10, 0, 127);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    		},

    		p: noop,

    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 500 });
    					div_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$m, safe_not_equal, []);
    	}
    }

    /* src\Routes.svelte generated by Svelte v3.6.7 */



    const routes = {
      "/": Home,
      "/login": LogIn,
      "/signup": SignUp,
      "/verifyaccount": VerifyAccount,
      "/forgotpassword": ForgotPassword,
      "/recoveraccount": RecoverAccount,
      "/dashboard": DashBoard,
      "/confirminvitation/:id": ConfirmInvitation,
      "/dashboard/invite": InviteEmployee,
      "/dashboard/invitations": Invitations,
      "/dashboard/shifts": Shifts,
      "/dashboard/postshift": PostShift,
      "*": NotFound
    };

    /* src\Header.svelte generated by Svelte v3.6.7 */

    const file$k = "src\\Header.svelte";

    // (42:4) {#if $isLoggedIn}
    function create_if_block_2$2(ctx) {
    	var button, span, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			attr(span, "class", "navbar-toggler-icon svelte-193ucez");
    			add_location(span, file$k, 43, 8, 820);
    			attr(button, "id", "menu-toggler");
    			attr(button, "class", "btn bg-light svelte-193ucez");
    			add_location(button, file$k, 42, 6, 741);
    			dispose = listen(button, "click", ctx.toggleMenu);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, span);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    // (58:4) {#if $isLoggedIn}
    function create_if_block$5(ctx) {
    	var div2, ul, li, a0, t0, div1, a1, t2, div0, t3, a2, dispose;

    	function select_block_type(ctx) {
    		if (ctx.$user.email !== undefined) return create_if_block_1$3;
    		return create_else_block$4;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div2 = element("div");
    			ul = element("ul");
    			li = element("li");
    			a0 = element("a");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			a1 = element("a");
    			a1.textContent = "Profile";
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Logout";
    			attr(a0, "class", "nav-link dropdown-toggle");
    			attr(a0, "href", "#/");
    			attr(a0, "id", "navbarDropdown");
    			attr(a0, "role", "button");
    			a0.dataset.toggle = "dropdown";
    			attr(a0, "aria-haspopup", "true");
    			attr(a0, "aria-expanded", "false");
    			add_location(a0, file$k, 77, 12, 2083);
    			attr(a1, "class", "dropdown-item");
    			attr(a1, "href", "#/");
    			add_location(a1, file$k, 88, 14, 2524);
    			attr(div0, "class", "dropdown-divider");
    			add_location(div0, file$k, 89, 14, 2586);
    			attr(a2, "class", "dropdown-item");
    			attr(a2, "href", "#/");
    			add_location(a2, file$k, 90, 14, 2634);
    			attr(div1, "class", "dropdown-menu svelte-193ucez");
    			attr(div1, "aria-labelledby", "navbarDropdown");
    			add_location(div1, file$k, 87, 12, 2448);
    			attr(li, "class", "nav-item dropdown");
    			add_location(li, file$k, 76, 10, 2039);
    			attr(ul, "class", "navbar-nav ml-auto svelte-193ucez");
    			add_location(ul, file$k, 59, 8, 1356);
    			attr(div2, "class", "collapse navbar-collapse svelte-193ucez");
    			attr(div2, "id", "navbarSupportedContent");
    			add_location(div2, file$k, 58, 6, 1280);
    			dispose = listen(a2, "click", handleLogout);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, ul);
    			append(ul, li);
    			append(li, a0);
    			if_block.m(a0, null);
    			append(li, t0);
    			append(li, div1);
    			append(div1, a1);
    			append(div1, t2);
    			append(div1, div0);
    			append(div1, t3);
    			append(div1, a2);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(a0, null);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			if_block.d();
    			dispose();
    		}
    	};
    }

    // (86:58) {:else}
    function create_else_block$4(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Loading...");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (86:14) {#if $user.email !== undefined}
    function create_if_block_1$3(ctx) {
    	var t_value = ctx.$user.email, t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$user) && t_value !== (t_value = ctx.$user.email)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$n(ctx) {
    	var main, nav, t0, a, t2, button, span, t3;

    	var if_block0 = (ctx.$isLoggedIn) && create_if_block_2$2(ctx);

    	var if_block1 = (ctx.$isLoggedIn) && create_if_block$5(ctx);

    	return {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			a = element("a");
    			a.textContent = "SWAPBOARD";
    			t2 = space();
    			button = element("button");
    			span = element("span");
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr(a, "class", "navbar-brand svelte-193ucez");
    			attr(a, "href", "#/");
    			add_location(a, file$k, 46, 4, 890);
    			attr(span, "class", "navbar-toggler-icon svelte-193ucez");
    			add_location(span, file$k, 55, 6, 1198);
    			attr(button, "class", "navbar-toggler svelte-193ucez");
    			attr(button, "type", "button");
    			button.dataset.toggle = "collapse";
    			button.dataset.target = "#navbarSupportedContent";
    			attr(button, "aria-controls", "navbarSupportedContent");
    			attr(button, "aria-expanded", "false");
    			attr(button, "aria-label", "Toggle navigation");
    			add_location(button, file$k, 47, 4, 943);
    			attr(nav, "class", "navbar fixed-top navbar-expand-sm navbar-light bg-light svelte-193ucez");
    			add_location(nav, file$k, 40, 2, 641);
    			add_location(main, file$k, 39, 0, 631);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, nav);
    			if (if_block0) if_block0.m(nav, null);
    			append(nav, t0);
    			append(nav, a);
    			append(nav, t2);
    			append(nav, button);
    			append(button, span);
    			append(nav, t3);
    			if (if_block1) if_block1.m(nav, null);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.$isLoggedIn) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					if_block0.m(nav, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.$isLoggedIn) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					if_block1.m(nav, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};
    }

    function handleLogout() {
      logout();
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $menuDisplayed, $isLoggedIn, $user;

    	validate_store(menuDisplayed, 'menuDisplayed');
    	subscribe($$self, menuDisplayed, $$value => { $menuDisplayed = $$value; $$invalidate('$menuDisplayed', $menuDisplayed); });
    	validate_store(isLoggedIn, 'isLoggedIn');
    	subscribe($$self, isLoggedIn, $$value => { $isLoggedIn = $$value; $$invalidate('$isLoggedIn', $isLoggedIn); });
    	validate_store(user, 'user');
    	subscribe($$self, user, $$value => { $user = $$value; $$invalidate('$user', $user); });

    	

      function toggleMenu() {
        menuDisplayed.set(!$menuDisplayed);
      }

    	return { toggleMenu, $isLoggedIn, $user };
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$n, safe_not_equal, []);
    	}
    }

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };

    var eventemitter3 = createCommonjsModule(function (module) {

    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @private
     */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Add a listener for a given event.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} once Specify if the listener is a one-time listener.
     * @returns {EventEmitter}
     * @private
     */
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }

      var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;

      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];

      return emitter;
    }

    /**
     * Clear event by name.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} evt The Event name.
     * @private
     */
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];

      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];

      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }

      return ee;
    };

    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];

      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {*} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
          listeners.fn === fn &&
          (!once || listeners.once) &&
          (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
            (once && !listeners[i].once) ||
            (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    {
      module.exports = EventEmitter;
    }
    });

    var isString_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function isString(value) {
        return typeof value === 'string';
    }
    exports.default = isString;
    //# sourceMappingURL=is-string.js.map
    });

    unwrapExports(isString_1);

    var isObject_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function isObject(value) {
        return ((value !== null) && (typeof value === 'object'));
    }
    exports.default = isObject;
    //# sourceMappingURL=is-object.js.map
    });

    unwrapExports(isObject_1);

    /**
     * Returns an operation AST given a document AST and optionally an operation
     * name. If a name is not provided, an operation is only returned if only one is
     * provided in the document.
     */
    function getOperationAST(documentAST, operationName) {
      var operation = null;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = documentAST.definitions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var definition = _step.value;

          if (definition.kind === Kind.OPERATION_DEFINITION) {
            if (!operationName) {
              // If no operation name was provided, only return an Operation if there
              // is one defined in the document. Upon encountering the second, return
              // null.
              if (operation) {
                return null;
              }

              operation = definition;
            } else if (definition.name && definition.name.value === operationName) {
              return definition;
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return operation;
    }

    var getOperationAST$1 = /*#__PURE__*/Object.freeze({
        getOperationAST: getOperationAST
    });

    var protocol = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var GRAPHQL_WS = 'graphql-ws';
    exports.GRAPHQL_WS = GRAPHQL_WS;
    var GRAPHQL_SUBSCRIPTIONS = 'graphql-subscriptions';
    exports.GRAPHQL_SUBSCRIPTIONS = GRAPHQL_SUBSCRIPTIONS;
    //# sourceMappingURL=protocol.js.map
    });

    unwrapExports(protocol);
    var protocol_1 = protocol.GRAPHQL_WS;
    var protocol_2 = protocol.GRAPHQL_SUBSCRIPTIONS;

    var defaults = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var WS_TIMEOUT = 30000;
    exports.WS_TIMEOUT = WS_TIMEOUT;
    //# sourceMappingURL=defaults.js.map
    });

    unwrapExports(defaults);
    var defaults_1 = defaults.WS_TIMEOUT;

    var messageTypes = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var MessageTypes = (function () {
        function MessageTypes() {
            throw new Error('Static Class');
        }
        MessageTypes.GQL_CONNECTION_INIT = 'connection_init';
        MessageTypes.GQL_CONNECTION_ACK = 'connection_ack';
        MessageTypes.GQL_CONNECTION_ERROR = 'connection_error';
        MessageTypes.GQL_CONNECTION_KEEP_ALIVE = 'ka';
        MessageTypes.GQL_CONNECTION_TERMINATE = 'connection_terminate';
        MessageTypes.GQL_START = 'start';
        MessageTypes.GQL_DATA = 'data';
        MessageTypes.GQL_ERROR = 'error';
        MessageTypes.GQL_COMPLETE = 'complete';
        MessageTypes.GQL_STOP = 'stop';
        MessageTypes.SUBSCRIPTION_START = 'subscription_start';
        MessageTypes.SUBSCRIPTION_DATA = 'subscription_data';
        MessageTypes.SUBSCRIPTION_SUCCESS = 'subscription_success';
        MessageTypes.SUBSCRIPTION_FAIL = 'subscription_fail';
        MessageTypes.SUBSCRIPTION_END = 'subscription_end';
        MessageTypes.INIT = 'init';
        MessageTypes.INIT_SUCCESS = 'init_success';
        MessageTypes.INIT_FAIL = 'init_fail';
        MessageTypes.KEEP_ALIVE = 'keepalive';
        return MessageTypes;
    }());
    exports.default = MessageTypes;
    //# sourceMappingURL=message-types.js.map
    });

    unwrapExports(messageTypes);

    var printer_1 = getCjsExportFromNamespace(printer);

    var getOperationAST_1 = getCjsExportFromNamespace(getOperationAST$1);

    var client = createCommonjsModule(function (module, exports) {
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var _global = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : (typeof window !== 'undefined' ? window : {});
    var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;










    var SubscriptionClient = (function () {
        function SubscriptionClient(url, options, webSocketImpl, webSocketProtocols) {
            var _a = (options || {}), _b = _a.connectionCallback, connectionCallback = _b === void 0 ? undefined : _b, _c = _a.connectionParams, connectionParams = _c === void 0 ? {} : _c, _d = _a.timeout, timeout = _d === void 0 ? defaults.WS_TIMEOUT : _d, _e = _a.reconnect, reconnect = _e === void 0 ? false : _e, _f = _a.reconnectionAttempts, reconnectionAttempts = _f === void 0 ? Infinity : _f, _g = _a.lazy, lazy = _g === void 0 ? false : _g, _h = _a.inactivityTimeout, inactivityTimeout = _h === void 0 ? 0 : _h;
            this.wsImpl = webSocketImpl || NativeWebSocket;
            if (!this.wsImpl) {
                throw new Error('Unable to find native implementation, or alternative implementation for WebSocket!');
            }
            this.wsProtocols = webSocketProtocols || protocol.GRAPHQL_WS;
            this.connectionCallback = connectionCallback;
            this.url = url;
            this.operations = {};
            this.nextOperationId = 0;
            this.wsTimeout = timeout;
            this.unsentMessagesQueue = [];
            this.reconnect = reconnect;
            this.reconnecting = false;
            this.reconnectionAttempts = reconnectionAttempts;
            this.lazy = !!lazy;
            this.inactivityTimeout = inactivityTimeout;
            this.closedByUser = false;
            this.backoff = new backo2({ jitter: 0.5 });
            this.eventEmitter = new eventemitter3.EventEmitter();
            this.middlewares = [];
            this.client = null;
            this.maxConnectTimeGenerator = this.createMaxConnectTimeGenerator();
            this.connectionParams = this.getConnectionParams(connectionParams);
            if (!this.lazy) {
                this.connect();
            }
        }
        Object.defineProperty(SubscriptionClient.prototype, "status", {
            get: function () {
                if (this.client === null) {
                    return this.wsImpl.CLOSED;
                }
                return this.client.readyState;
            },
            enumerable: true,
            configurable: true
        });
        SubscriptionClient.prototype.close = function (isForced, closedByUser) {
            if (isForced === void 0) { isForced = true; }
            if (closedByUser === void 0) { closedByUser = true; }
            this.clearInactivityTimeout();
            if (this.client !== null) {
                this.closedByUser = closedByUser;
                if (isForced) {
                    this.clearCheckConnectionInterval();
                    this.clearMaxConnectTimeout();
                    this.clearTryReconnectTimeout();
                    this.unsubscribeAll();
                    this.sendMessage(undefined, messageTypes.default.GQL_CONNECTION_TERMINATE, null);
                }
                this.client.close();
                this.client = null;
                this.eventEmitter.emit('disconnected');
                if (!isForced) {
                    this.tryReconnect();
                }
            }
        };
        SubscriptionClient.prototype.request = function (request) {
            var _a;
            var getObserver = this.getObserver.bind(this);
            var executeOperation = this.executeOperation.bind(this);
            var unsubscribe = this.unsubscribe.bind(this);
            var opId;
            this.clearInactivityTimeout();
            return _a = {},
                _a[result.default] = function () {
                    return this;
                },
                _a.subscribe = function (observerOrNext, onError, onComplete) {
                    var observer = getObserver(observerOrNext, onError, onComplete);
                    opId = executeOperation(request, function (error, result) {
                        if (error === null && result === null) {
                            if (observer.complete) {
                                observer.complete();
                            }
                        }
                        else if (error) {
                            if (observer.error) {
                                observer.error(error[0]);
                            }
                        }
                        else {
                            if (observer.next) {
                                observer.next(result);
                            }
                        }
                    });
                    return {
                        unsubscribe: function () {
                            if (opId) {
                                unsubscribe(opId);
                                opId = null;
                            }
                        },
                    };
                },
                _a;
        };
        SubscriptionClient.prototype.on = function (eventName, callback, context) {
            var handler = this.eventEmitter.on(eventName, callback, context);
            return function () {
                handler.off(eventName, callback, context);
            };
        };
        SubscriptionClient.prototype.onConnected = function (callback, context) {
            return this.on('connected', callback, context);
        };
        SubscriptionClient.prototype.onConnecting = function (callback, context) {
            return this.on('connecting', callback, context);
        };
        SubscriptionClient.prototype.onDisconnected = function (callback, context) {
            return this.on('disconnected', callback, context);
        };
        SubscriptionClient.prototype.onReconnected = function (callback, context) {
            return this.on('reconnected', callback, context);
        };
        SubscriptionClient.prototype.onReconnecting = function (callback, context) {
            return this.on('reconnecting', callback, context);
        };
        SubscriptionClient.prototype.onError = function (callback, context) {
            return this.on('error', callback, context);
        };
        SubscriptionClient.prototype.unsubscribeAll = function () {
            var _this = this;
            Object.keys(this.operations).forEach(function (subId) {
                _this.unsubscribe(subId);
            });
        };
        SubscriptionClient.prototype.applyMiddlewares = function (options) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var queue = function (funcs, scope) {
                    var next = function (error) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            if (funcs.length > 0) {
                                var f = funcs.shift();
                                if (f) {
                                    f.applyMiddleware.apply(scope, [options, next]);
                                }
                            }
                            else {
                                resolve(options);
                            }
                        }
                    };
                    next();
                };
                queue(_this.middlewares.slice(), _this);
            });
        };
        SubscriptionClient.prototype.use = function (middlewares) {
            var _this = this;
            middlewares.map(function (middleware) {
                if (typeof middleware.applyMiddleware === 'function') {
                    _this.middlewares.push(middleware);
                }
                else {
                    throw new Error('Middleware must implement the applyMiddleware function.');
                }
            });
            return this;
        };
        SubscriptionClient.prototype.getConnectionParams = function (connectionParams) {
            return function () { return new Promise(function (resolve, reject) {
                if (typeof connectionParams === 'function') {
                    try {
                        return resolve(connectionParams.call(null));
                    }
                    catch (error) {
                        return reject(error);
                    }
                }
                resolve(connectionParams);
            }); };
        };
        SubscriptionClient.prototype.executeOperation = function (options, handler) {
            var _this = this;
            if (this.client === null) {
                this.connect();
            }
            var opId = this.generateOperationId();
            this.operations[opId] = { options: options, handler: handler };
            this.applyMiddlewares(options)
                .then(function (processedOptions) {
                _this.checkOperationOptions(processedOptions, handler);
                if (_this.operations[opId]) {
                    _this.operations[opId] = { options: processedOptions, handler: handler };
                    _this.sendMessage(opId, messageTypes.default.GQL_START, processedOptions);
                }
            })
                .catch(function (error) {
                _this.unsubscribe(opId);
                handler(_this.formatErrors(error));
            });
            return opId;
        };
        SubscriptionClient.prototype.getObserver = function (observerOrNext, error, complete) {
            if (typeof observerOrNext === 'function') {
                return {
                    next: function (v) { return observerOrNext(v); },
                    error: function (e) { return error && error(e); },
                    complete: function () { return complete && complete(); },
                };
            }
            return observerOrNext;
        };
        SubscriptionClient.prototype.createMaxConnectTimeGenerator = function () {
            var minValue = 1000;
            var maxValue = this.wsTimeout;
            return new backo2({
                min: minValue,
                max: maxValue,
                factor: 1.2,
            });
        };
        SubscriptionClient.prototype.clearCheckConnectionInterval = function () {
            if (this.checkConnectionIntervalId) {
                clearInterval(this.checkConnectionIntervalId);
                this.checkConnectionIntervalId = null;
            }
        };
        SubscriptionClient.prototype.clearMaxConnectTimeout = function () {
            if (this.maxConnectTimeoutId) {
                clearTimeout(this.maxConnectTimeoutId);
                this.maxConnectTimeoutId = null;
            }
        };
        SubscriptionClient.prototype.clearTryReconnectTimeout = function () {
            if (this.tryReconnectTimeoutId) {
                clearTimeout(this.tryReconnectTimeoutId);
                this.tryReconnectTimeoutId = null;
            }
        };
        SubscriptionClient.prototype.clearInactivityTimeout = function () {
            if (this.inactivityTimeoutId) {
                clearTimeout(this.inactivityTimeoutId);
                this.inactivityTimeoutId = null;
            }
        };
        SubscriptionClient.prototype.setInactivityTimeout = function () {
            var _this = this;
            if (this.inactivityTimeout > 0 && Object.keys(this.operations).length === 0) {
                this.inactivityTimeoutId = setTimeout(function () {
                    if (Object.keys(_this.operations).length === 0) {
                        _this.close();
                    }
                }, this.inactivityTimeout);
            }
        };
        SubscriptionClient.prototype.checkOperationOptions = function (options, handler) {
            var query = options.query, variables = options.variables, operationName = options.operationName;
            if (!query) {
                throw new Error('Must provide a query.');
            }
            if (!handler) {
                throw new Error('Must provide an handler.');
            }
            if ((!isString_1.default(query) && !getOperationAST_1.getOperationAST(query, operationName)) ||
                (operationName && !isString_1.default(operationName)) ||
                (variables && !isObject_1.default(variables))) {
                throw new Error('Incorrect option types. query must be a string or a document,' +
                    '`operationName` must be a string, and `variables` must be an object.');
            }
        };
        SubscriptionClient.prototype.buildMessage = function (id, type, payload) {
            var payloadToReturn = payload && payload.query ? __assign({}, payload, { query: typeof payload.query === 'string' ? payload.query : printer_1.print(payload.query) }) :
                payload;
            return {
                id: id,
                type: type,
                payload: payloadToReturn,
            };
        };
        SubscriptionClient.prototype.formatErrors = function (errors) {
            if (Array.isArray(errors)) {
                return errors;
            }
            if (errors && errors.errors) {
                return this.formatErrors(errors.errors);
            }
            if (errors && errors.message) {
                return [errors];
            }
            return [{
                    name: 'FormatedError',
                    message: 'Unknown error',
                    originalError: errors,
                }];
        };
        SubscriptionClient.prototype.sendMessage = function (id, type, payload) {
            this.sendMessageRaw(this.buildMessage(id, type, payload));
        };
        SubscriptionClient.prototype.sendMessageRaw = function (message) {
            switch (this.status) {
                case this.wsImpl.OPEN:
                    var serializedMessage = JSON.stringify(message);
                    try {
                        JSON.parse(serializedMessage);
                    }
                    catch (e) {
                        this.eventEmitter.emit('error', new Error("Message must be JSON-serializable. Got: " + message));
                    }
                    this.client.send(serializedMessage);
                    break;
                case this.wsImpl.CONNECTING:
                    this.unsentMessagesQueue.push(message);
                    break;
                default:
                    if (!this.reconnecting) {
                        this.eventEmitter.emit('error', new Error('A message was not sent because socket is not connected, is closing or ' +
                            'is already closed. Message was: ' + JSON.stringify(message)));
                    }
            }
        };
        SubscriptionClient.prototype.generateOperationId = function () {
            return String(++this.nextOperationId);
        };
        SubscriptionClient.prototype.tryReconnect = function () {
            var _this = this;
            if (!this.reconnect || this.backoff.attempts >= this.reconnectionAttempts) {
                return;
            }
            if (!this.reconnecting) {
                Object.keys(this.operations).forEach(function (key) {
                    _this.unsentMessagesQueue.push(_this.buildMessage(key, messageTypes.default.GQL_START, _this.operations[key].options));
                });
                this.reconnecting = true;
            }
            this.clearTryReconnectTimeout();
            var delay = this.backoff.duration();
            this.tryReconnectTimeoutId = setTimeout(function () {
                _this.connect();
            }, delay);
        };
        SubscriptionClient.prototype.flushUnsentMessagesQueue = function () {
            var _this = this;
            this.unsentMessagesQueue.forEach(function (message) {
                _this.sendMessageRaw(message);
            });
            this.unsentMessagesQueue = [];
        };
        SubscriptionClient.prototype.checkConnection = function () {
            if (this.wasKeepAliveReceived) {
                this.wasKeepAliveReceived = false;
                return;
            }
            if (!this.reconnecting) {
                this.close(false, true);
            }
        };
        SubscriptionClient.prototype.checkMaxConnectTimeout = function () {
            var _this = this;
            this.clearMaxConnectTimeout();
            this.maxConnectTimeoutId = setTimeout(function () {
                if (_this.status !== _this.wsImpl.OPEN) {
                    _this.reconnecting = true;
                    _this.close(false, true);
                }
            }, this.maxConnectTimeGenerator.duration());
        };
        SubscriptionClient.prototype.connect = function () {
            var _this = this;
            this.client = new this.wsImpl(this.url, this.wsProtocols);
            this.checkMaxConnectTimeout();
            this.client.onopen = function () { return __awaiter(_this, void 0, void 0, function () {
                var connectionParams, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.status === this.wsImpl.OPEN)) return [3, 4];
                            this.clearMaxConnectTimeout();
                            this.closedByUser = false;
                            this.eventEmitter.emit(this.reconnecting ? 'reconnecting' : 'connecting');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4, this.connectionParams()];
                        case 2:
                            connectionParams = _a.sent();
                            this.sendMessage(undefined, messageTypes.default.GQL_CONNECTION_INIT, connectionParams);
                            this.flushUnsentMessagesQueue();
                            return [3, 4];
                        case 3:
                            error_1 = _a.sent();
                            this.sendMessage(undefined, messageTypes.default.GQL_CONNECTION_ERROR, error_1);
                            this.flushUnsentMessagesQueue();
                            return [3, 4];
                        case 4: return [2];
                    }
                });
            }); };
            this.client.onclose = function () {
                if (!_this.closedByUser) {
                    _this.close(false, false);
                }
            };
            this.client.onerror = function (err) {
                _this.eventEmitter.emit('error', err);
            };
            this.client.onmessage = function (_a) {
                var data = _a.data;
                _this.processReceivedData(data);
            };
        };
        SubscriptionClient.prototype.processReceivedData = function (receivedData) {
            var parsedMessage;
            var opId;
            try {
                parsedMessage = JSON.parse(receivedData);
                opId = parsedMessage.id;
            }
            catch (e) {
                throw new Error("Message must be JSON-parseable. Got: " + receivedData);
            }
            if ([messageTypes.default.GQL_DATA,
                messageTypes.default.GQL_COMPLETE,
                messageTypes.default.GQL_ERROR,
            ].indexOf(parsedMessage.type) !== -1 && !this.operations[opId]) {
                this.unsubscribe(opId);
                return;
            }
            switch (parsedMessage.type) {
                case messageTypes.default.GQL_CONNECTION_ERROR:
                    if (this.connectionCallback) {
                        this.connectionCallback(parsedMessage.payload);
                    }
                    break;
                case messageTypes.default.GQL_CONNECTION_ACK:
                    this.eventEmitter.emit(this.reconnecting ? 'reconnected' : 'connected');
                    this.reconnecting = false;
                    this.backoff.reset();
                    this.maxConnectTimeGenerator.reset();
                    if (this.connectionCallback) {
                        this.connectionCallback();
                    }
                    break;
                case messageTypes.default.GQL_COMPLETE:
                    this.operations[opId].handler(null, null);
                    delete this.operations[opId];
                    break;
                case messageTypes.default.GQL_ERROR:
                    this.operations[opId].handler(this.formatErrors(parsedMessage.payload), null);
                    delete this.operations[opId];
                    break;
                case messageTypes.default.GQL_DATA:
                    var parsedPayload = !parsedMessage.payload.errors ?
                        parsedMessage.payload : __assign({}, parsedMessage.payload, { errors: this.formatErrors(parsedMessage.payload.errors) });
                    this.operations[opId].handler(null, parsedPayload);
                    break;
                case messageTypes.default.GQL_CONNECTION_KEEP_ALIVE:
                    var firstKA = typeof this.wasKeepAliveReceived === 'undefined';
                    this.wasKeepAliveReceived = true;
                    if (firstKA) {
                        this.checkConnection();
                    }
                    if (this.checkConnectionIntervalId) {
                        clearInterval(this.checkConnectionIntervalId);
                        this.checkConnection();
                    }
                    this.checkConnectionIntervalId = setInterval(this.checkConnection.bind(this), this.wsTimeout);
                    break;
                default:
                    throw new Error('Invalid message type!');
            }
        };
        SubscriptionClient.prototype.unsubscribe = function (opId) {
            if (this.operations[opId]) {
                delete this.operations[opId];
                this.setInactivityTimeout();
                this.sendMessage(opId, messageTypes.default.GQL_STOP, undefined);
            }
        };
        return SubscriptionClient;
    }());
    exports.SubscriptionClient = SubscriptionClient;
    //# sourceMappingURL=client.js.map
    });

    unwrapExports(client);
    var client_1 = client.SubscriptionClient;

    var WebSocketLink = (function (_super) {
        __extends(WebSocketLink, _super);
        function WebSocketLink(paramsOrClient) {
            var _this = _super.call(this) || this;
            if (paramsOrClient instanceof client_1) {
                _this.subscriptionClient = paramsOrClient;
            }
            else {
                _this.subscriptionClient = new client_1(paramsOrClient.uri, paramsOrClient.options, paramsOrClient.webSocketImpl);
            }
            return _this;
        }
        WebSocketLink.prototype.request = function (operation) {
            return this.subscriptionClient.request(operation);
        };
        return WebSocketLink;
    }(ApolloLink));
    //# sourceMappingURL=bundle.esm.js.map

    function useLocalStorage(store, key) {
      //console.log('imported useLocalStorage');
      const json = localStorage.getItem(key);
      if (json) {
        //console.log('got json');
        store.set(JSON.parse(json));
      }
      const unsubscribe = store.subscribe(current => {
        //console.log('storing...' + JSON.stringify(current));
        localStorage.setItem(key, JSON.stringify(current));
      });
    }

    function useSessionStorage(store, key) {
      //console.log('imported useLocalStorage');
      const json = sessionStorage.getItem(key);
      if (json) {
        //console.log('got json');
        store.set(JSON.parse(json));
      }
      const unsubscribe = store.subscribe(current => {
        //console.log('storing...' + JSON.stringify(current));
        sessionStorage.setItem(key, JSON.stringify(current));
      });
    }

    /* src\App.svelte generated by Svelte v3.6.7 */

    const file$l = "src\\App.svelte";

    // (250:8) {#if !$user.isCompany}
    function create_if_block_1$4(ctx) {
    	var li, a;

    	return {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			a.textContent = "Post Shift";
    			attr(a, "href", "#/dashboard/postshift");
    			attr(a, "class", "svelte-1iijn7s");
    			add_location(a, file$l, 251, 12, 6692);
    			attr(li, "class", "svelte-1iijn7s");
    			add_location(li, file$l, 250, 10, 6674);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, a);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    // (261:10) {:else}
    function create_else_block$5(ctx) {
    	var a;

    	return {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Invitations";
    			attr(a, "href", "#/dashboard/invitations");
    			attr(a, "class", "svelte-1iijn7s");
    			add_location(a, file$l, 261, 12, 6982);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (259:10) {#if $user.isCompany}
    function create_if_block$6(ctx) {
    	var a;

    	return {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Invite";
    			attr(a, "href", "#/dashboard/invite");
    			attr(a, "class", "svelte-1iijn7s");
    			add_location(a, file$l, 259, 12, 6910);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    function create_fragment$o(ctx) {
    	var main, t0, div2, div0, ul, t1, li0, a, t3, li1, t4, div1, t5, div2_class_value, current;

    	var header = new Header({ $$inline: true });

    	var if_block0 = (!ctx.$user.isCompany) && create_if_block_1$4();

    	function select_block_type(ctx) {
    		if (ctx.$user.isCompany) return create_if_block$6;
    		return create_else_block$5;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block1 = current_block_type(ctx);

    	var noto = new Noto({ $$inline: true });

    	var router = new Router({
    		props: { routes: routes },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			main = element("main");
    			header.$$.fragment.c();
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			ul = element("ul");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			li0 = element("li");
    			a = element("a");
    			a.textContent = "Shift";
    			t3 = space();
    			li1 = element("li");
    			if_block1.c();
    			t4 = space();
    			div1 = element("div");
    			noto.$$.fragment.c();
    			t5 = space();
    			router.$$.fragment.c();
    			attr(a, "href", "#/dashboard/shifts");
    			attr(a, "class", "svelte-1iijn7s");
    			add_location(a, file$l, 255, 10, 6796);
    			attr(li0, "class", "svelte-1iijn7s");
    			add_location(li0, file$l, 254, 8, 6780);
    			attr(li1, "class", "svelte-1iijn7s");
    			add_location(li1, file$l, 257, 8, 6859);
    			attr(ul, "class", "sidebar-nav svelte-1iijn7s");
    			add_location(ul, file$l, 248, 6, 6606);
    			attr(div0, "id", "sidebar-wrapper");
    			attr(div0, "class", " svelte-1iijn7s");
    			add_location(div0, file$l, 246, 4, 6561);
    			attr(div1, "id", "page-content-wrapper");
    			attr(div1, "class", "svelte-1iijn7s");
    			add_location(div1, file$l, 266, 4, 7094);
    			attr(div2, "id", "wrapper");
    			attr(div2, "class", div2_class_value = "" + (ctx.$menuDisplayed ? 'menuDisplayed' : '') + " svelte-1iijn7s");
    			add_location(div2, file$l, 244, 2, 6489);
    			add_location(main, file$l, 242, 0, 6465);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(header, main, null);
    			append(main, t0);
    			append(main, div2);
    			append(div2, div0);
    			append(div0, ul);
    			if (if_block0) if_block0.m(ul, null);
    			append(ul, t1);
    			append(ul, li0);
    			append(li0, a);
    			append(ul, t3);
    			append(ul, li1);
    			if_block1.m(li1, null);
    			append(div2, t4);
    			append(div2, div1);
    			mount_component(noto, div1, null);
    			append(div1, t5);
    			mount_component(router, div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.$user.isCompany) {
    				if (!if_block0) {
    					if_block0 = create_if_block_1$4();
    					if_block0.c();
    					if_block0.m(ul, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);
    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(li1, null);
    				}
    			}

    			var router_changes = {};
    			if (changed.routes) router_changes.routes = routes;
    			router.$set(router_changes);

    			if ((!current || changed.$menuDisplayed) && div2_class_value !== (div2_class_value = "" + (ctx.$menuDisplayed ? 'menuDisplayed' : '') + " svelte-1iijn7s")) {
    				attr(div2, "class", div2_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(noto.$$.fragment, local);

    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(noto.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			destroy_component(header, );

    			if (if_block0) if_block0.d();
    			if_block1.d();

    			destroy_component(noto, );

    			destroy_component(router, );
    		}
    	};
    }

    async function loggedOutFunc() {
      menuDisplayed.set(false);
      clearTokenRefreshTimeout();
      push("/login");
      console.log("loggedOut, pushing to /login");
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $isLoggedIn, $keepMeLoggedIn, $menuDisplayed, $user;

    	validate_store(isLoggedIn, 'isLoggedIn');
    	subscribe($$self, isLoggedIn, $$value => { $isLoggedIn = $$value; $$invalidate('$isLoggedIn', $isLoggedIn); });
    	validate_store(keepMeLoggedIn, 'keepMeLoggedIn');
    	subscribe($$self, keepMeLoggedIn, $$value => { $keepMeLoggedIn = $$value; $$invalidate('$keepMeLoggedIn', $keepMeLoggedIn); });
    	validate_store(menuDisplayed, 'menuDisplayed');
    	subscribe($$self, menuDisplayed, $$value => { $menuDisplayed = $$value; $$invalidate('$menuDisplayed', $menuDisplayed); });
    	validate_store(user, 'user');
    	subscribe($$self, user, $$value => { $user = $$value; $$invalidate('$user', $user); });

    	

      const HTTP_GRAPHQL_ENDPOINT =
        (window.location.protocol.includes("https") ? "https" : "http") +
        "://" +
        window.location.host +
        "/graphql";

      const WS_GRAPHQL_ENDPOINT =
        (window.location.protocol.includes("https") ? "wss" : "ws") +
        "://" +
        window.location.host +
        "/graphql";

      // console.log("PROTOCOL HTTP : " + HTTP_GRAPHQL_ENDPOINT);
      // console.log("PROTOCOL WS : " + WS_GRAPHQL_ENDPOINT);

      const httpLink = new HttpLink({
        uri: HTTP_GRAPHQL_ENDPOINT
        // credentials: 'same-origin'
      });

      const wsLink = new WebSocketLink({
        uri: WS_GRAPHQL_ENDPOINT,
        options: {
          reconnect: true
        }
      });

      const link = split(
        ({ query }) => {
          const { kind, operation } = getMainDefinition(query);
          return kind === "OperationDefinition" && operation === "subscription";
        },
        wsLink,
        httpLink
      );

      const client = new ApolloClient({
        link,
        cache: new InMemoryCache()
      });

      setClient(client);

      useSessionStorage(isLoggedIn, "isLoggedIn");
      useLocalStorage(keepMeLoggedIn, "keepMeLoggedIn");
      useLocalStorage(refreshToken, "refreshToken");
      useLocalStorage(lastLoggedIn, "lastLoggedIn");
      useLocalStorage(user, "user");

      window.addEventListener("storage", function(event) {
        if (event.key === "login-event") {
          if (!$isLoggedIn) {
            setTimeout(() => {
              isLoggedIn.set(true);
            }, Math.random() * (1000 - 500) + 500);
          }
        } else if (event.key === "logout-event") {
          isLoggedIn.set(false);
          sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
        } else if (event.key === "start-timeout-event") {
          setTimeout(() => {
            tokenRefreshTimeoutFunc(client);
          }, Math.random() * (10000 - 5000) + 5000);
        } else if (event.key === "new-tab-event") {
          if ($isLoggedIn) {
            localStorage.setItem("login-event", "login" + Math.random());
          }
        }
      });

      window.addEventListener("beforeunload", function(event) {
        if (sessionStorage.getItem("startedTimeoutSession") === null) {
          return;
        }

        if (JSON.parse(sessionStorage.getItem("startedTimeoutSession")) === true) {
          sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
          localStorage.setItem("startedTimeout", JSON.stringify(false));
          localStorage.setItem("start-timeout-event", "timeout" + Math.random());
        }
      });

      async function loggedInFunc() {
        push("/dashboard");
        console.log("loggedIn, pushing to /dashboard");
        await tokenRefreshTimeoutFunc(client);
        await fetchUser(client);
        fetchConnections(client);
        menuDisplayed.set(true);
      }

      onMount(async () => {
        if ($isLoggedIn) {
          console.log("Already Logged In");
          return;
        }

        if ($keepMeLoggedIn) {
          console.log("Keep Me Logged In is True");
          isLoggedIn.set(true);
          return;
        }

        localStorage.setItem("new-tab-event", "newTab" + Math.random());

        // CHECK USER IF USER IS IN SESSION
        // await checkSession(client);
      });

    	$$self.$$.update = ($$dirty = { $isLoggedIn: 1 }) => {
    		if ($$dirty.$isLoggedIn) { if ($isLoggedIn === false) {
            loggedOutFunc();
          } else {
            loggedInFunc();
          } }
    	};

    	if (window.screen.availWidth < 640) {
            menuDisplayed.set(false);
          }

    	return { $menuDisplayed, $user };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$o, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
