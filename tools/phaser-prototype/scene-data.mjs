import fs from "node:fs";
import vm from "node:vm";
import { resolve } from "node:path";

const urlPattern = /url\("([^"]+)"\)/g;

function urlsOf(css) {
  return Array.from(String(css || "").matchAll(urlPattern), (m) => m[1]);
}

function loadVillage(projectRoot) {
  const files = ["static/terrain.js", "static/village-content.js", "static/sprites.js"].map(
    (file) => resolve(projectRoot, file)
  );
  const sandbox = { console };
  vm.createContext(sandbox);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
  }
  vm.runInContext(
    `globalThis.__village = {
      VILLAGE_MAP, VILLAGE_HOUSES, VILLAGE_SEALED, VILLAGE_NPCS,
      VILLAGE_SIGNS, VILLAGE_SPAWN,
      parsed: villageParseMap(VILLAGE_MAP),
      mats: villageMaterials(villageParseMap(VILLAGE_MAP)),
      villageTileUri, terrainBg, VILLAGE_GROUND,
      TERRAIN_DOORS, TERRAIN_VILLAGE, TERRAIN_ICONS, TERRAIN_OBJECTS,
      TERRAIN_DECOR, SPRITES,
      villageHouseAtDoor, villageBuildingAtDoor, villageBuildingByKey
    };`,
    sandbox,
    { filename: "scene-export.js" }
  );
  return { files, village: sandbox.__village };
}

export function buildVillageScene(projectRoot) {
  const { village: v } = loadVillage(projectRoot);
  const parsed = v.parsed;
  const mats = v.mats;
  const textures = {};
  const byUri = new Map();

  function textureKey(uri) {
    if (!uri) return "";
    if (byUri.has(uri)) return byUri.get(uri);
    const key = "t" + byUri.size;
    byUri.set(uri, key);
    textures[key] = uri;
    return key;
  }

  const ground = [];
  const decor = [];
  for (let y = 0; y < parsed.h; y += 1) {
    const groundRow = [];
    const decorRow = [];
    for (let x = 0; x < parsed.w; x += 1) {
      const mat = mats.mat[y][x];
      if (mat) {
        const uri = urlsOf(
          v.villageTileUri(mat, mats.roofKind[y][x], mats.roofColor[y][x], x, y)
        )[0];
        groundRow.push(textureKey(uri));
        decorRow.push("");
      } else {
        const decorCode = parsed.decor[y] && parsed.decor[y][x] ? parsed.decor[y][x] : 0;
        const urls = urlsOf(v.terrainBg(v.VILLAGE_GROUND, x, y, true, decorCode));
        groundRow.push(textureKey(urls[urls.length - 1]));
        decorRow.push(urls.length > 1 ? textureKey(urls[0]) : "");
      }
    }
    ground.push(groundRow);
    decor.push(decorRow);
  }

  const iconFor = {
    tree: v.TERRAIN_OBJECTS.tree,
    fence: v.TERRAIN_VILLAGE.objects.fence,
    well: v.TERRAIN_DECOR.lamp[0],
    fire: v.TERRAIN_DECOR.fire[0],
    sign: v.TERRAIN_OBJECTS.sign,
    barrel: v.TERRAIN_VILLAGE.objects.barrel,
    woodpile: v.TERRAIN_VILLAGE.objects.woodpile,
    chimney: v.TERRAIN_VILLAGE.objects.chimney,
    crate: v.TERRAIN_OBJECTS.crate,
    table: v.TERRAIN_OBJECTS.table,
    chair: v.TERRAIN_OBJECTS.chair,
    anvil: v.TERRAIN_OBJECTS.anvil,
    scaffold: v.TERRAIN_VILLAGE.objects.woodpile
  };

  const props = [];
  const addProps = (list) => {
    (list || []).forEach((o) => {
      const uri = iconFor[o.kind];
      if (!uri) return;
      props.push({
        x: o.x,
        y: o.y,
        key: textureKey(uri),
        kind: o.kind,
        title: o.title || "",
        text: o.text || ""
      });
    });
  };
  addProps(parsed.objects.filter((o) => o.kind !== "door" && o.kind !== "locked"));
  addProps(mats.props || []);

  const doors = parsed.objects
    .filter((o) => o.kind === "door" || o.kind === "locked")
    .map((o) => {
      const key =
        o.kind === "locked"
          ? (v.VILLAGE_SEALED.find((b) => b.door.x === o.x && b.door.y === o.y) || {}).key
          : v.villageHouseAtDoor(o.x, o.y);
      const building = key ? v.villageBuildingByKey(key) : null;
      return {
        x: o.x,
        y: o.y,
        locked: o.kind === "locked",
        key: key || "",
        name: building ? building.name : "Дверь",
        texture: textureKey(v.TERRAIN_DOORS[o.kind === "locked" ? 1 : 0] || v.TERRAIN_DOORS[0])
      };
    });

  const npcs = v.VILLAGE_NPCS.filter((n) => n.place === "village").map((n) => ({
    x: n.at.x,
    y: n.at.y,
    key: n.key,
    name: n.name,
    texture: textureKey(v.SPRITES["npc_" + n.key] || "")
  }));

  const signs = parsed.objects
    .filter((o) => o.kind === "sign")
    .map((o) => ({ x: o.x, y: o.y, title: o.title || "Табличка", text: o.text || "" }));

  const blocked = parsed.grid.map((row, y) =>
    row.map(
      (value, x) => value !== 1 || parsed.objects.some((o) => o.x === x && o.y === y && o.blocked)
    )
  );

  return {
    width: parsed.w,
    height: parsed.h,
    spawn: { ...v.VILLAGE_SPAWN },
    player: textureKey(v.SPRITES.player),
    ground,
    decor,
    props,
    doors,
    npcs,
    signs,
    blocked,
    textures
  };
}
