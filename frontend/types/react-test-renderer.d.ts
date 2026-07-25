declare module "react-test-renderer" {
  export interface ReactTestRenderer {
    root: any;
    toJSON(): any;
    toTree(): any;
    update(nextElement: any): void;
    unmount(nextElement?: any): void;
    getInstance(): any;
  }
  export function create(element: any, options?: any): ReactTestRenderer;
  export function act(
    callback: () => void | Promise<void>,
  ): void | Promise<void>;
}
