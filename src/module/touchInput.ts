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

  getTarget(evt: PIXI.FederatedPointerEvent): PlaceableObject | null {
    let target = evt.target as PlaceableObject;
    while (!target?.document && target?.parent) {
      target = target.parent as PlaceableObject;
    }
    if (!target.document) {
      return null;
    }
    return target;
  }

  hook(): void {
    if (!canvas.ready) return;
    canvas.stage?.on("touchstart", (evt) => {
      this.touches++;
      this.tapStart = Date.now();
      this.tapStartPos = evt.client;
      if (this.touches > 1) {
        this.cancelled = true;
      }
    });

    canvas.stage?.on("touchmove", (evt) => {
      if (
        evt.client.x != this.tapStartPos.x ||
        evt.client.y != this.tapStartPos.y
      ) {
        this.cancelled = true;
      }
    });

    canvas.stage?.on("touchend", (evt) => {
      if (this.touches > 0) this.touches--;
      if (!this.cancelled && Date.now() - this.tapStart < this.tapMaxTime) {
        const target = this.getTarget(evt);
        if (!target) {
          globalThis.MobileMode.navigation.toggleHud();
        }
      }
      this.cancelled = false;
    });

    console.log("Mobile Improvements | Touch tap hooked");
  }
}
