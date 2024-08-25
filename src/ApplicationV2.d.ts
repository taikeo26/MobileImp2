interface ApplicationRenderContext {}

declare class ApplicationV2 {
  constructor(options: any);

  /**
   * Convenience references to window header elements.
   */
  window: {
    header: HTMLElement;
    resize: HTMLElement;
    title: HTMLHeadingElement;
    icon: HTMLElement;
    close: HTMLButtonElement;
    controls: HTMLButtonElement;
    controlsDropdown: HTMLDivElement;
    onDrag: () => unknown;
    onResize: () => unknown;
    pointerStartPosition: unknown;
    pointerMoveThrottle: boolean;
  };

  options: any;

  /**
   * The HTML element ID of this Application instance.
   */
  id: string;
  /**
   * A convenience reference to the title of the Application window.
   */
  title: string;

  /**
   * The HTMLElement which renders this Application into the DOM.
   */
  element?: HTMLElement;

  /**
   * Is this Application instance currently minimized?
   * @type {boolean}
   */
  minimized: boolean;

  /**
   * Is this Application instance currently rendered?
   */
  rendered: boolean;
  /**
   * Render the Application, creating its HTMLElement and replacing its innerHTML.
   * Add it to the DOM if it is not currently rendered and rendering is forced. Otherwise, re-render its contents.
   * @param {boolean|RenderOptions} [options]     Options which configure application rendering behavior.
   *                                              A boolean is interpreted as the "force" option.
   * @param {RenderOptions} [_options]            Legacy options for backwards-compatibility with the original
   *                                              ApplicationV1#render signature.
   * @returns                                     A Promise which resolves to the rendered Application instance
   */
  render(options?: unknown): Promise<ApplicationV2>;

  /**
   * Close the Application, removing it from the DOM.
   * @param {ApplicationClosingOptions} [options] Options which modify how the application is closed.
   * @returns            A Promise which resolves to the closed Application instance
   */
  close(options?: unknown): Promise<ApplicationV2>;

  /**
   * Minimize the Application, collapsing it to a minimal header.
   */
  minimize(): Promise<void>;
  /**
   * Restore the Application to its original dimensions.
   */
  maximize(): Promise<void>;

  /**
   * Bring this Application window to the front of the rendering stack by increasing its z-index.
   * Once ApplicationV1 is deprecated we should switch from _maxZ to ApplicationV2#maxZ
   * We should also eliminate ui.activeWindow in favor of only ApplicationV2#frontApp
   */
  bringToFront(): void;
  /**
   * Render an HTMLElement for the Application.
   * An Application subclass must implement this method in order for the Application to be renderable.
   * @param context      Context data for the render operation
   * @param  options     Options which configure application rendering behavior
   * @returns            The result of HTML rendering may be implementation specific.
   *                     Whatever value is returned here is passed to _replaceHTML
   * @abstract
   */
  _renderHTML(context: ApplicationRenderContext, options): Promise<unknown>;
  /**
   * Replace the HTML of the application with the result provided by the rendering backend.
   * An Application subclass should implement this method in order for the Application to be renderable.
   * @param result             The result returned by the application rendering backend
   * @param content            The content element into which the rendered result must be inserted
   * @param options            Options which configure application rendering behavior
   * @protected
   */
  _replaceHTML(
    result: ReturnType<ApplicationV2["_renderHTML"]>,
    content: HTMLElement,
    options
  );
}
