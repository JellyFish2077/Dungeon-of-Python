import Phaser from "phaser";
import type { Door, Npc, SceneData, Sign } from "./types";
import { hideDialog, hidePrompt, showDialog, showPrompt } from "./ui";

const TILE = 32;
const HERO_SPEED = 165;

interface Interaction {
  label: string;
  run: () => void;
}

type Hero = Phaser.GameObjects.Image & { body: Phaser.Physics.Arcade.Body };

export class VillageScene extends Phaser.Scene {
  private village!: SceneData;
  private hero!: Hero;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private fpsEl: HTMLElement | null = document.querySelector("#fps");
  private interaction: Interaction | null = null;

  constructor() {
    super("village");
  }

  init(data: SceneData): void {
    this.village = data;
  }

  preload(): void {
    for (const [key, uri] of Object.entries(this.village.textures)) {
      if (uri) this.load.image(key, uri);
    }
  }

  create(): void {
    const { width, height, spawn } = this.village;

    this.physics.world.setBounds(0, 0, width * TILE, height * TILE);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const ground = this.village.ground[y]?.[x];
        if (ground) {
          this.add
            .image(x * TILE, y * TILE, ground)
            .setOrigin(0)
            .setDepth(0);
        }
        const decor = this.village.decor[y]?.[x];
        if (decor) {
          this.add
            .image(x * TILE, y * TILE, decor)
            .setOrigin(0)
            .setDepth(1);
        }
      }
    }

    for (const prop of this.village.props) {
      this.add
        .image(prop.x * TILE, prop.y * TILE, prop.key)
        .setOrigin(0)
        .setDepth(4 + prop.y * 0.01);
    }

    for (const door of this.village.doors) {
      this.add
        .image(door.x * TILE, door.y * TILE, door.texture)
        .setOrigin(0)
        .setDepth(4.5);
    }

    for (const npc of this.village.npcs) {
      this.add
        .image(npc.x * TILE, npc.y * TILE, npc.texture)
        .setOrigin(0)
        .setDepth(5 + npc.y * 0.01);
    }

    const walls = this.physics.add.staticGroup();
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!this.village.blocked[y]?.[x]) continue;
        const body = this.add.rectangle(
          x * TILE + TILE / 2,
          y * TILE + TILE / 2,
          TILE,
          TILE,
          0x000000,
          0
        );
        this.physics.add.existing(body, true);
        walls.add(body);
      }
    }

    this.hero = this.add
      .image(spawn.x * TILE + TILE / 2, spawn.y * TILE + TILE / 2, this.village.player)
      .setDisplaySize(26, 26)
      .setDepth(10) as Hero;
    this.physics.add.existing(this.hero);
    this.hero.body.setSize(18, 18);
    this.hero.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.hero, walls);

    this.cameras.main.setBounds(0, 0, width * TILE, height * TILE);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.cameras.main.centerOn(this.hero.x, this.hero.y);
    this.cameras.main.setZoom(1.6);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
      "W" | "A" | "S" | "D",
      Phaser.Input.Keyboard.Key
    >;
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _objects: Phaser.GameObjects.GameObject[],
        _dx: number,
        dy: number
      ) => {
        const zoom = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.0012, 1, 2.4);
        this.cameras.main.setZoom(zoom);
      }
    );

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.fpsEl) this.fpsEl.textContent = Math.round(this.game.loop.actualFps) + " FPS";
      }
    });
  }

  update(): void {
    const body = this.hero.body;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * HERO_SPEED;
      vy = (vy / len) * HERO_SPEED;
    }
    body.setVelocity(vx, vy);

    this.interaction = this.findInteraction();
    if (this.interaction) showPrompt(this.interaction.label);
    else hidePrompt();

    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.interaction) {
      hidePrompt();
      this.interaction.run();
      this.interaction = null;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) hideDialog();
  }

  private findInteraction(): Interaction | null {
    const px = Math.floor(this.hero.x / TILE);
    const py = Math.floor(this.hero.y / TILE);
    const near = (point: { x: number; y: number }) =>
      Math.abs(point.x - px) + Math.abs(point.y - py) <= 1;

    const door = this.village.doors.find((d: Door) => near(d));
    if (door) {
      return {
        label: `E — ${door.locked ? "Восстановить" : "Войти"}: ${door.name}`,
        run: () =>
          showDialog(
            door.name,
            door.locked
              ? "Дверь заколочена. В игре здесь открывается окно восстановления постройки."
              : "В прототипе дверь только показывает окно. В игре здесь был бы вход в дом."
          )
      };
    }

    const npc = this.village.npcs.find((n: Npc) => near(n));
    if (npc) {
      return {
        label: `E — Поговорить: ${npc.name}`,
        run: () =>
          showDialog(
            npc.name,
            npc.key === "guard"
              ? "Страж входа: «Спуск в подземелье открыт». В прототипе это проверка ввода и DOM-окна."
              : "Наставник: «WASD — идти, E — действие, колесо — зум»."
          )
      };
    }

    const sign = this.village.signs.find((s: Sign) => near(s));
    if (sign) {
      return {
        label: `E — Прочитать: ${sign.title}`,
        run: () => showDialog(sign.title, sign.text || "Надпись стёрлась от времени.")
      };
    }

    return null;
  }
}
