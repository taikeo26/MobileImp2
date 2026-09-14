declare global {
  interface LenientGlobalVariableTypes {
    canvas: never;
  }
}

export class TouchInput {
  cancelled = false;
  tapMaxTime = 400;
  tapStart = -1;
  tapStartPos = { x: 0, y: 0 };
  touches = 0;
  stage: any = null;

  getTarget(evt: any): PlaceableObject | null {
    let target = evt.target as PlaceableObject;

    while (!target?.document && target?.parent) {
      target = target.parent as PlaceableObject;
    }

    if (!target?.document) return null;

    return target;
  }

  isTouch(evt: any): boolean {
    return evt?.pointerType === "touch" || evt?.pointerType === "pen";
  }

  clientPosition(evt: any): { x: number; y: number } {
    if (evt?.client) {
      return {
        x: evt.client.x,
        y: evt.client.y,
      };
    }

    return {
      x: evt?.clientX ?? 0,
      y: evt?.clientY ?? 0,
    };
  }

  onPointerDown = (evt: any) => {
    if (!this.isTouch(evt)) return;

    this.touches++;
    this.tapStart = Date.now();
    this.tapStartPos = this.clientPosition(evt);

    if (this.touches > 1) {
      this.cancelled = true;
    }
  };

  onPointerMove = (evt: any) => {
    if (!this.isTouch(evt)) return;

    const position = this.clientPosition(evt);

    if (
      position.x !== this.tapStartPos.x ||
      position.y !== this.tapStartPos.y
    ) {
      this.cancelled = true;
    }
  };

  onPointerUp = (evt: any) => {
    if (!this.isTouch(evt)) return;

    if (this.touches > 0) {
      this.touches--;
    }

    if (
      !this.cancelled &&
      Date.now() - this.tapStart < this.tapMaxTime
    ) {
      const target = this.getTarget(evt);

      if (!target) {
        globalThis.MobileMode.navigation.toggleHud();
      }
    }

    if (this.touches === 0) {
      this.cancelled = false;
    }
  };

  unhook(): void {
    if (!this.stage) return;

    this.stage.off("pointerdown", this.onPointerDown);
    this.stage.off("pointermove", this.onPointerMove);
    this.stage.off("pointerup", this.onPointerUp);
    this.stage.off("pointerupoutside", this.onPointerUp);

    this.stage = null;
    this.touches = 0;
    this.cancelled = false;
  }

  hook(): void {
    if (!canvas.ready || !canvas.stage) return;

    if (this.stage === canvas.stage) return;

    this.unhook();

    this.stage = canvas.stage;

    this.stage.on("pointerdown", this.onPointerDown);
    this.stage.on("pointermove", this.onPointerMove);
    this.stage.on("pointerup", this.onPointerUp);
    this.stage.on("pointerupoutside", this.onPointerUp);

    console.log(
      "Mobile Improvements | Touch tap hooked for Foundry V14"
    );
  }
}
