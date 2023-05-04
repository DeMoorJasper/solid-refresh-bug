import { createComponent, mergeProps, Dynamic, memo } from 'solid-js/web';
import { createContext, useContext, onMount, onCleanup, createEffect, splitProps } from 'solid-js';
import { mountedStates, style, createMotionState, createStyles } from '@motionone/dom';
import { isFunction } from '@motionone/utils';
import { resolveFirst } from '@solid-primitives/refs';
import { createSwitchTransition } from '@solid-primitives/transition-group';
import { combineStyle } from '@solid-primitives/props';

const PresenceContext = createContext();
/**
 * Perform exit/enter trantisions of children `<Motion>` components.
 *
 * accepts props:
 * - `initial` – *(Defaults to `true`)* – If `false`, will disable the first animation on all child `Motion` elements the first time `Presence` is rendered.
 * - `exitBeforeEnter` – *(Defaults to `false`)* – If `true`, `Presence` will wait for the exiting element to finish animating out before animating in the next one.
 *
 * @example
 * ```tsx
 * <Presence exitBeforeEnter>
 *   <Show when={toggle()}>
 *     <Motion.div
 *       initial={{ opacity: 0 }}
 *       animate={{ opacity: 1 }}
 *       exit={{ opacity: 0 }}
 *     />
 *   </Show>
 * </Presence>
 * ```
 */

const Presence = props => {
  let initial = props.initial !== false;

  const render = createComponent(PresenceContext.Provider, {
    value: () => initial,

    get children() {
      return createComponent(ParentContext.Provider, {
        value: undefined,

        get children() {
          return createSwitchTransition(resolveFirst(() => props.children), {
            appear: initial,
            mode: props.exitBeforeEnter ? "out-in" : "parallel",

            onExit(el, remove) {
              const state = mountedStates.get(el);
              if (state && state.getOptions().exit) onCompleteExit(el, remove);else remove();
            }

          });
        }

      });
    }

  });

  initial = true;
  return render;
};

const onCompleteExit = (el, fn) => el.addEventListener("motioncomplete", fn);
/** @internal */

function createAndBindMotionState(el, options, presenceState, parentState) {
  const state = createMotionState(presenceState?.() === false ? { ...options(),
    initial: false
  } : options(), parentState);
  onMount(() => {
    const unmount = state.mount(el());
    onCleanup(() => {
      if (presenceState && options().exit) {
        state.setActive("exit", true);
        onCompleteExit(el(), unmount);
      } else unmount();
    });
    isFunction(options) && createEffect(() => state.update(options()));
  });
  return [state, createStyles(state.getTarget())];
}
/**
 * createMotion provides MotionOne as a compact Solid primitive.
 *
 * @param target Target Element to animate.
 * @param options Options to effect the animation.
 * @param presenceState Optional PresenceContext override, defaults to current parent.
 * @returns Object to access MotionState
 */

function createMotion(target, options, presenceState) {
  const [state, styles] = createAndBindMotionState(() => target, typeof options === "function" ? options : () => options, presenceState);

  for (const key in styles) {
    style.set(target, key, styles[key]);
  }

  return state;
}
/**
 * motion is a Solid directive that makes binding to elements easier.
 *
 * @param el Target Element to bind to.
 * @param props Options to effect the animation.
 */

function motion(el, props) {
  createMotion(el, props, useContext(PresenceContext));
}

const OPTION_KEYS = ["initial", "animate", "inView", "inViewOptions", "hover", "press", "variants", "transition", "exit"];
const ATTR_KEYS = ["tag", "ref", "style", "onMotionStart", "onMotionComplete", "onHoverStart", "onHoverEnd", "onPressStart", "onPressEnd", "onViewEnter", "onViewLeave"];
const ParentContext = createContext();
/** @internal */

const MotionComponent = props => {
  const [options,, attrs] = splitProps(props, OPTION_KEYS, ATTR_KEYS);
  const [state, style] = createAndBindMotionState(() => root, () => ({ ...options
  }), useContext(PresenceContext), useContext(ParentContext));
  let root;
  return createComponent(ParentContext.Provider, {
    value: state,

    get children() {
      return createComponent(Dynamic, mergeProps({
        ref: el => {
          root = el;
          props.ref?.(el);
        },

        get component() {
          return props.tag || "div";
        },

        get style() {
          return memo(() => !!props.style, true)() ? combineStyle(props.style, style) : style;
        },

        get ["on:motionstart"]() {
          return props.onMotionStart;
        },

        get ["on:motioncomplete"]() {
          return props.onMotionComplete;
        },

        get ["on:hoverstart"]() {
          return props.onHoverStart;
        },

        get ["on:hoverend"]() {
          return props.onHoverEnd;
        },

        get ["on:pressstart"]() {
          return props.onPressStart;
        },

        get ["on:pressend"]() {
          return props.onPressEnd;
        },

        get ["on:viewenter"]() {
          return props.onViewEnter;
        },

        get ["on:viewleave"]() {
          return props.onViewLeave;
        }

      }, attrs));
    }

  });
};
/**
 * Renders an animatable HTML or SVG element.
 *
 * @component
 * Animation props:
 * - `animate` a target of values to animate to. Accepts all the same values and keyframes as Motion One's [animate function](https://motion.dev/dom/animate). This prop is **reactive** – changing it will animate the transition element to the new state.
 * - `transition` for changing type of animation
 * - `initial` a target of values to animate from when the element is first rendered.
 * - `exit` a target of values to animate to when the element is removed. The element must be a direct child of the `<Presence>` component.
 *
 * @example
 * ```tsx
 * <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}/>
 * ```
 *
 * Interaction animation props:
 *
 * - `inView` animation target for when the element is in view
 * - `hover` animate when hovered
 * - `press` animate when pressed
 *
 * @example
 * ```tsx
 * <Motion.div hover={{ scale: 1.2 }} press={{ scale: 0.9 }}/>
 * ```
 */

const Motion = new Proxy(MotionComponent, {
  get: (_, tag) => props => createComponent(MotionComponent, mergeProps(props, {
    tag: tag
  }))
});

export { Motion, Presence, PresenceContext, createMotion, motion };
//# sourceMappingURL=index.js.map