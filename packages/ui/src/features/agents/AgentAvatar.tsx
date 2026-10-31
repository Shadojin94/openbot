import { type Block, BloubBot, makeBlock, POSES } from "@norbert_bodziony/bloub";
import {
  type AvatarMood,
  avatarMoodIsBusy,
  avatarMoodPresentation,
  type ShapeSafeStateId,
} from "@openbot/brand/bloub-avatar-motion";
import type { AvatarHue } from "@openbot/contracts/ipc";
import { prefersReducedMotion } from "@openbot/ui/utils";
import type { JSX } from "@solidjs/web";
import { createEffect, createMemo, createSignal, onSettled, Show } from "solid-js";
import { type AvatarMotion, bloubAvatarProfile, type SupportedAvatarSilhouetteId } from "../../bloub-avatar";
import type { AgentProfile } from "../../data";
import { createPointerGaze } from "./avatar-pointer-gaze";

// Cap avatar animation at 30fps: uncapped bloub clocks measured 30% renderer / 24% GPU
// for two visible avatars. The shape is 24-40px, so the eye cannot see the difference.
const AVATAR_FPS = 30;
const SIDEBAR_MOTION_HOLD_FACTOR = 1.25;

// Resting montage shown on hover: shape-safe blocks only, so the seeded silhouette stays
// on screen while the face carries the personality (blink, wink, wide eyes).
const DEFAULT_CYCLE: Block[] = [
  slowerBlock("idle"),
  makeBlock("wink"),
  slowerBlock("idle"),
  makeBlock("wide"),
  slowerBlock("idle"),
];

// Motions that rest until pointer/focus arrives. The sidebar is not virtualized, so every
// row would otherwise animate on screen; idle-window profiles showed 83 recalcs/s from
// four resting avatars. A mood with its own motion keeps animating as the busy signal.
const STATIC_MOTIONS: ReadonlySet<AvatarMotion> = new Set(["hover", "idle"]);

// Hover group lookup: the first `[data-avatar-hover]`/control ancestor, since dialogs and
// scroll regions with `[tabindex]` are too wide to count as one.
const HOVER_GROUP = "[data-avatar-hover], button, a, [role='button'], [role='link'], [role='menuitem']";

function slowerBlock(state: ShapeSafeStateId): Block {
  const block = makeBlock(state);
  return { ...block, duration: block.duration * SIDEBAR_MOTION_HOLD_FACTOR };
}

interface AgentAvatarProps {
  agent?: Pick<AgentProfile, "avatarSeed" | "avatarHue" | "avatarUrl"> | undefined;
  seed?: string | undefined;
  hue?: AvatarHue | null;
  url?: string | null | undefined;
  motion?: AvatarMotion;
  /** What the agent is doing. It chooses the face, never the silhouette. */
  mood?: AvatarMood;
  cycleOffset?: number;
  animationOffset?: number;
  shape?: SupportedAvatarSilhouetteId;
  /**
   * The eyes follow the pointer, and a press makes the agent nod. The avatar then moves without hover,
   * so use it only where few avatars show. A photo avatar and reduced motion ignore it.
   */
  followPointer?: boolean;
  class?: string;
  style?: Record<string, string>;
}

export function AgentAvatar(props: AgentAvatarProps) {
  const seed = () => props.seed ?? props.agent?.avatarSeed ?? "agent";
  const hue = () => (props.hue !== undefined ? props.hue : (props.agent?.avatarHue ?? null));
  const motion = () => props.motion ?? "hover";
  const url = () => (props.url !== undefined ? props.url : (props.agent?.avatarUrl ?? null));
  const mood = (): AvatarMood => props.mood ?? "idle";
  const presentation = () => avatarMoodPresentation(mood());
  const [imageFailed, setImageFailed] = createSignal(false);
  createEffect(
    () => url(),
    () => {
      setImageFailed(false);
    },
  );
  const className = () => `agent-avatar agent-avatar-motion-${motion()} ${props.class ?? ""}`;
  // The custom property rides with the attribute rather than being set on every avatar: the
  // keyframe is an infinite animation, and a selector that matched all of them would start one
  // behind every resting row in the sidebar.
  const breathe = () => (presentation().breathe > 0 ? String(presentation().breathe) : undefined);
  const style = (): Record<string, string> => {
    const amount = breathe();
    return amount ? { ...props.style, "--agent-avatar-breathe": amount } : { ...props.style };
  };
  return (
    <Show
      when={url() && !imageFailed()}
      fallback={
        <GeneratedAvatar
          seed={seed()}
          hue={hue()}
          motion={motion()}
          mood={mood()}
          cycleOffset={props.cycleOffset}
          animationOffset={props.animationOffset}
          shape={props.shape}
          followPointer={props.followPointer === true}
          breathe={breathe()}
          class={className()}
          style={style()}
        />
      }
    >
      <span
        class={`${className()} agent-avatar-custom`}
        style={style()}
        data-avatar="image"
        data-mood={mood()}
        data-breathe={breathe()}
        aria-hidden="true"
      >
        {/* A photo cannot wear an expression, so the spectral thread carries the mood around it,
            the same one the generated avatar wears. */}
        <AvatarRings when={presentation().rings}>
          <AvatarImage url={url()} onFailed={() => setImageFailed(true)} />
        </AvatarRings>
      </span>
    </Show>
  );
}

function AvatarImage(props: { url: string | null; onFailed: () => void }) {
  return <img src={props.url ?? ""} alt="" draggable={false} onError={() => props.onFailed()} />;
}

/**
 * The Zetamind spectral thread: one thin ring of the eight spectrum colours that turns around a
 * working avatar. It is CSS only, so a busy row starts no animation loop of its own, and the avatar
 * keeps its silhouette and its face.
 */
function AvatarRings(props: { when: boolean; children: JSX.Element }) {
  return (
    <>
      {props.children}
      <Show when={props.when}>
        <span class="agent-avatar-fil" aria-hidden="true" />
      </Show>
    </>
  );
}

function GeneratedAvatar(props: {
  seed: string;
  hue: AvatarHue | null;
  motion: AvatarMotion;
  mood: AvatarMood;
  cycleOffset?: number | undefined;
  animationOffset?: number | undefined;
  shape?: SupportedAvatarSilhouetteId | undefined;
  followPointer: boolean;
  breathe?: string | undefined;
  class: string;
  style?: Record<string, string>;
}) {
  let element: HTMLSpanElement | undefined;
  const gaze = createPointerGaze();
  const [interacting, setInteracting] = createSignal(false);
  const [reducedMotion, setReducedMotion] = createSignal(prefersReducedMotion());
  const presentation = createMemo(() => avatarMoodPresentation(props.mood));
  const profile = createMemo(() => bloubAvatarProfile(props.seed, props.hue));
  // The silhouette and the colour are identity and come only from the seed. The mood may lend the
  // face an expression; when it does not, the seeded one is the resting face.
  const appearance = createMemo(() => ({
    shape: props.shape ?? profile().shape,
    color: profile().color,
    expression: presentation().expression ?? profile().expression,
    state: presentation().state,
  }));
  const cycle = createMemo(() => offsetCycle(DEFAULT_CYCLE, props.cycleOffset ?? 0));
  // A mood that carries its own motion has to be seen without being pointed at, and so do eyes that
  // follow the pointer; the resting moods keep the hover gating that the perf note above is about.
  const animated = () =>
    !reducedMotion() &&
    (props.followPointer || avatarMoodIsBusy(props.mood) || !STATIC_MOTIONS.has(props.motion) || interacting());
  const gazeScript = createMemo(() => (props.followPointer ? gaze.script : null));
  const motionCycle = () => {
    if (props.mood !== "idle") return [slowerBlock(presentation().state)];
    return cycle();
  };

  onSettled(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(media?.matches ?? false);
    syncReducedMotion();
    media?.addEventListener?.("change", syncReducedMotion);

    // What must be hovered or focused for a resting avatar to move: the control the avatar sits in or
    // beside, marked with `data-avatar-hover` when the avatar is only a neighbour of it. A dialog and a
    // scroll region are focusable as well, and taking one of those would start every avatar on it at once.
    const group = element?.closest<HTMLElement>(`${HOVER_GROUP}, [tabindex]`);
    const interactionTarget = group?.matches(HOVER_GROUP) ? group : element;
    const startInteraction = () => setInteracting(true);
    const stopInteraction = () => setInteracting(false);
    // Only keyboard focus starts the avatar. A click leaves the focus on the button it lands on, such as
    // the sidebar row of the open channel, and the window gives that button `focusin` again each time it
    // comes back to the front. No pointer is there to leave, so the avatar moved until the next click.
    const startFocusInteraction = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) startInteraction();
    };
    const stopFocusInteraction = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !interactionTarget?.contains(event.relatedTarget)) {
        stopInteraction();
      }
    };
    interactionTarget?.addEventListener("pointerenter", startInteraction);
    interactionTarget?.addEventListener("pointerleave", stopInteraction);
    interactionTarget?.addEventListener("focusin", startFocusInteraction);
    interactionTarget?.addEventListener("focusout", stopFocusInteraction);

    return () => {
      media?.removeEventListener?.("change", syncReducedMotion);
      interactionTarget?.removeEventListener("pointerenter", startInteraction);
      interactionTarget?.removeEventListener("pointerleave", stopInteraction);
      interactionTarget?.removeEventListener("focusin", startFocusInteraction);
      interactionTarget?.removeEventListener("focusout", stopFocusInteraction);
    };
  });

  createEffect(
    () => props.followPointer,
    (follow) => {
      if (follow && element) return gaze.attach(element);
    },
  );

  const avatar = () => (
    <BloubBot
      size={100}
      shape={appearance().shape}
      color={appearance().color}
      expression={appearance().expression}
      cycle={motionCycle()}
      playing={true}
      fps={AVATAR_FPS}
      initialPhase={props.animationOffset ?? avatarAnimationPhase(props.seed)}
      gaze={gazeScript()}
      ariaLabel=""
      class="bloub-avatar-svg"
    />
  );

  return (
    <span
      ref={element}
      class={`${props.class} agent-avatar-bloub`}
      style={props.style}
      data-avatar="generated"
      data-mood={props.mood}
      data-breathe={props.breathe}
      aria-hidden="true"
    >
      <AvatarRings when={presentation().rings}>
        <Show
          when={animated()}
          fallback={
            /* A frozen Bloub frame cannot finish a morph, and the engine reads `state` only when it
               is built, so a mood change has to rebuild the bot. Keying on the appearance, state
               included, does both: `frozenAt` alone would sample the seeded idle face. */
            <Show when={appearance()} keyed>
              {(frozen) => (
                <BloubBot
                  size={100}
                  shape={frozen.shape}
                  color={frozen.color}
                  expression={frozen.expression}
                  state={frozen.state}
                  frozenAt={POSES[frozen.state]}
                  ariaLabel=""
                  class="bloub-avatar-svg"
                />
              )}
            </Show>
          }
        >
          {avatar()}
        </Show>
      </AvatarRings>
    </span>
  );
}

function avatarAnimationPhase(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) / 0x100000000) * 1.4;
}

function offsetCycle(blocks: Block[], offset: number): Block[] {
  if (blocks.length === 0) return blocks;
  const start = ((Math.trunc(offset) % blocks.length) + blocks.length) % blocks.length;
  if (start === 0) return blocks;
  return [...blocks.slice(start), ...blocks.slice(0, start)];
}
