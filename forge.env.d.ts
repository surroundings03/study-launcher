/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

declare module 'electron-squirrel-startup' {
  const squirrelStartup: boolean;
  export default squirrelStartup;
}
