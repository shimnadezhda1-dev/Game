import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

await mkdir("licenses", { recursive: true });

await copyFile("node_modules/react/LICENSE", "licenses/MIT-React.txt");
await copyFile("node_modules/@capacitor/core/LICENSE", "licenses/MIT-Capacitor.txt");

const apacheRes = await fetch("https://www.apache.org/licenses/LICENSE-2.0.txt");
if (!apacheRes.ok) {
  throw new Error(`Apache-2.0 download failed: ${apacheRes.status}`);
}
await writeFile("licenses/Apache-2.0.txt", await apacheRes.text(), "utf8");

const notice = `AndroidX AppCompat
AndroidX CoordinatorLayout
AndroidX Core SplashScreen

Copyright The Android Open Source Project

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Official license text: licenses/Apache-2.0.txt
`;
await writeFile("licenses/AndroidX-NOTICE.txt", notice, "utf8");
console.log("wrote license files");
