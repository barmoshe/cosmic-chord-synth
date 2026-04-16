export type Vec3 = [number, number, number];

export type BodyKind = "core" | "planet" | "moon" | "comet" | "spark";
export type Timbre = "lead" | "pad" | "bass" | "arp" | "drone";

export interface Body {
  id: number;
  kind: BodyKind;
  pos: Vec3;
  vel: Vec3;
  acc: Vec3;
  mass: number;
  radius: number;
  parentId?: number;
  scaleDegree: number;
  octave: number;
  timbre: Timbre;
  lastNoteAt: number;
  orbitPhase: number;
  prevOrbitPhase: number;
  age: number;
  ttl?: number;
  color: Vec3;
}

export type PhysicsEventKind =
  | "orbitCross"
  | "proximity"
  | "collision"
  | "perihelion"
  | "fieldEnter"
  | "fieldExit";

export interface PhysicsEvent {
  kind: PhysicsEventKind;
  time: number;
  body: Body;
  otherId?: number;
  speed?: number;
  distance?: number;
}

export interface FieldImpulse {
  pos: Vec3;
  radius: number;
  strength: number;
  mode: "attract" | "repel";
  ttl: number;
  age: number;
}
