# Orrery

Open `index.html` through a local static server:

```sh
python3 -m http.server 8080
```

Then visit http://localhost:8080. Babylon.js loads from its browser CDN; all facts and textures are local. Use the rail, arrow keys/Home/End, drag to orbit, and scroll to travel. The app detects missing WebGL and honors `prefers-reduced-motion`.
