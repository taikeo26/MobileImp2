// Extra types not covered by foundry-pc-types

interface Window {
  WindowManager: import("./module/windowManager").WindowManager;
  libWrapper: {
    register(
      package_id: string,
      target: number | string,
      fn: (arg: any) => any,
      type?: string,
      options?: any
    ): void;
    unregister(package_id: string, target: number, fail?: boolean): void;
  };
}
