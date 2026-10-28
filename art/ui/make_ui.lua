-- PyDungeon UI kit: carved stone + ember brass.
-- Run: aseprite --batch --script art/ui/make_ui.lua
-- Sources are saved next to the preview PNGs; the runtime copies live in static/ui.

local OUT = "C:/Users/JellyFish/Downloads/python-quiz-dev/"
local SRC = OUT .. "art/ui/src/"
local PNG = OUT .. "static/ui/"

local INK       = Color(5, 8, 13, 255)
local STONE0    = Color(9, 14, 21, 255)
local STONE1    = Color(16, 24, 34, 255)
local STONE2    = Color(24, 35, 48, 255)
local STONE3    = Color(33, 47, 62, 255)
local BRASS_LO  = Color(122, 85, 34, 255)
local BRASS     = Color(214, 168, 75, 255)
local BRASS_HI  = Color(246, 214, 132, 255)
local EMBER_LO  = Color(122, 53, 33, 255)
local EMBER     = Color(201, 107, 59, 255)
local EMBER_HI  = Color(240, 150, 98, 255)
local CREAM     = Color(238, 228, 207, 255)
local MOSS      = Color(111, 143, 90, 255)
local MOSS_HI   = Color(157, 191, 132, 255)
local MOSS_LO   = Color(76, 107, 61, 255)

local function new_sprite(w, h)
  local sprite = Sprite(w, h, ColorMode.RGB)
  local layer = sprite:newLayer()
  layer.name = "ui"
  local image = Image(w, h, ColorMode.RGB)
  local cel = sprite:newCel(layer, 1, image, Point(0, 0))
  local img = cel.image
  img:clear(Color(0, 0, 0, 0))
  return sprite, img
end

local function save(sprite, name)
  sprite:saveAs(SRC .. name .. ".aseprite")
  sprite:saveCopyAs(PNG .. name .. ".png")
end

local function px(image, x, y, color)
  if x < 0 or y < 0 or x >= image.width or y >= image.height then return end
  image:putPixel(x, y, color)
end

local function rect(image, x, y, w, h, color)
  for yy = y, y + h - 1 do
    for xx = x, x + w - 1 do
      px(image, xx, yy, color)
    end
  end
end

local function hline(image, x, y, w, color)
  rect(image, x, y, w, 1, color)
end

local function vline(image, x, y, h, color)
  rect(image, x, y, 1, h, color)
end

local function ring(image, inset, color)
  local w, h = image.width, image.height
  hline(image, inset, inset, w - inset * 2, color)
  hline(image, inset, h - inset - 1, w - inset * 2, color)
  vline(image, inset, inset, h - inset * 2, color)
  vline(image, w - inset - 1, inset, h - inset * 2, color)
end

-- 3x3 rivet: dark seat, brass head, bright pixel.
local function rivet(image, x, y, head)
  rect(image, x, y, 3, 3, INK)
  px(image, x + 1, y + 1, head or BRASS)
  px(image, x + 1, y, BRASS_HI)
  px(image, x, y + 1, BRASS_HI)
end

local function corner_bracket(image, x, y, dx, dy, color)
  hline(image, x, y, 7, color)
  vline(image, x, y, 7, color)
end

-- ---------------------------------------------------------------------------
-- Panels
-- ---------------------------------------------------------------------------

local function panel(name, corner)
  local size = corner * 4
  local sprite, image = new_sprite(size, size)
  -- transparent center: the page supplies the stone texture behind it
  ring(image, 0, INK)
  ring(image, 1, BRASS_LO)
  ring(image, 2, BRASS)
  -- top-left catches light, bottom-right falls into shadow
  hline(image, 3, 3, size - 6, BRASS_HI)
  vline(image, 3, 3, size - 6, BRASS_HI)
  hline(image, 3, size - 4, size - 6, STONE3)
  vline(image, size - 4, 3, size - 6, STONE3)
  -- inner dark seam
  hline(image, 4, 4, size - 8, STONE0)
  vline(image, 4, 4, size - 8, STONE0)
  hline(image, 4, size - 5, size - 8, BRASS_LO)
  vline(image, size - 5, 4, size - 8, BRASS_LO)
  -- corner studs inside the 4px frame
  local off = 6
  rivet(image, off, off, BRASS)
  rivet(image, size - off - 3, off, BRASS)
  rivet(image, off, size - off - 3, BRASS)
  rivet(image, size - off - 3, size - off - 3, BRASS)
  save(sprite, name)
end

panel("panel-dark", 16)
panel("panel-small", 12)
panel("minimap-frame", 12)

-- ---------------------------------------------------------------------------
-- Buttons
-- ---------------------------------------------------------------------------

local function button(name, outer, body, light, dark, studs)
  local size = 48
  local corner = 12
  local sprite, image = new_sprite(size, size)
  ring(image, 0, INK)
  ring(image, 1, outer)
  ring(image, 2, body)
  hline(image, 3, 3, size - 6, light)
  vline(image, 3, 3, size - 6, light)
  hline(image, 3, size - 4, size - 6, dark)
  vline(image, size - 4, 3, size - 6, dark)
  hline(image, 4, 4, size - 8, INK)
  vline(image, 4, 4, size - 8, INK)
  hline(image, 4, size - 5, size - 8, outer)
  vline(image, size - 5, 4, size - 8, outer)
  if studs then
    rivet(image, 7, 7, CREAM)
    rivet(image, size - 10, 7, CREAM)
    rivet(image, 7, size - 10, CREAM)
    rivet(image, size - 10, size - 10, CREAM)
  end
  save(sprite, name)
end

button("button-primary", EMBER_LO, EMBER, EMBER_HI, EMBER_LO, false)
button("button-primary-hover", EMBER_LO, EMBER_HI, CREAM, EMBER_LO, false)
button("button-primary-active", EMBER_LO, EMBER_LO, EMBER_LO, EMBER_HI, false)
button("button-ghost", BRASS_LO, STONE2, BRASS, STONE0, false)
button("button-ghost-hover", BRASS, STONE3, BRASS_HI, BRASS_LO, false)

-- ---------------------------------------------------------------------------
-- Bars
-- ---------------------------------------------------------------------------

local function bar_track()
  local w, h = 24, 12
  local sprite, image = new_sprite(w, h)
  rect(image, 0, 0, w, h, STONE1)
  ring(image, 0, INK)
  ring(image, 1, BRASS_LO)
  hline(image, 2, 2, w - 4, STONE0)
  vline(image, 2, 2, h - 4, STONE0)
  -- checker shadow at the bottom of the channel
  for x = 3, w - 4 do
    if x % 2 == 0 then px(image, x, h - 3, STONE0) end
  end
  save(sprite, "bar-track")
end

local function bar_fill(name, base, light, dark)
  local w, h = 24, 8
  local sprite, image = new_sprite(w, h)
  rect(image, 0, 0, w, h, base)
  hline(image, 0, 0, w, light)
  hline(image, 0, 1, w, light)
  hline(image, 0, h - 1, w, dark)
  -- sparse dither so a long bar does not look like a flat gradient
  for x = 0, w - 1 do
    if x % 4 == 1 then px(image, x, 3, light) end
    if x % 4 == 3 then px(image, x, 4, dark) end
    if x % 8 == 0 then px(image, x, 2, dark) end
  end
  save(sprite, name)
end

bar_track()
bar_fill("bar-hp", EMBER, EMBER_HI, EMBER_LO)
bar_fill("bar-xp", MOSS, MOSS_HI, MOSS_LO)

-- ---------------------------------------------------------------------------
-- Nav icons, 18x18
-- ---------------------------------------------------------------------------

local function icon(name, draw)
  local sprite, image = new_sprite(18, 18)
  draw(image)
  save(sprite, name)
end

icon("icon-stats", function(image)
  rect(image, 3, 9, 3, 7, BRASS)
  rect(image, 8, 5, 3, 11, BRASS)
  rect(image, 13, 2, 3, 14, CREAM)
  hline(image, 3, 9, 3, BRASS_HI)
  hline(image, 8, 5, 3, BRASS_HI)
  hline(image, 13, 2, 3, CREAM)
end)

icon("icon-map", function(image)
  rect(image, 2, 4, 4, 11, STONE2)
  rect(image, 7, 3, 4, 11, STONE3)
  rect(image, 12, 4, 4, 11, STONE2)
  vline(image, 6, 4, 10, BRASS)
  vline(image, 11, 3, 11, BRASS)
  hline(image, 2, 4, 14, BRASS_HI)
  hline(image, 2, 14, 14, BRASS_LO)
end)

icon("icon-inventory", function(image)
  rect(image, 3, 6, 12, 10, BRASS)
  rect(image, 4, 7, 10, 8, STONE1)
  hline(image, 5, 5, 8, BRASS_HI)
  vline(image, 5, 5, 2, BRASS_HI)
  vline(image, 12, 5, 2, BRASS_HI)
  px(image, 8, 10, CREAM)
  px(image, 9, 10, CREAM)
end)

icon("icon-achievements", function(image)
  rect(image, 5, 2, 8, 7, BRASS)
  rect(image, 6, 3, 6, 5, STONE1)
  vline(image, 4, 4, 4, BRASS_HI)
  vline(image, 13, 4, 4, BRASS_HI)
  rect(image, 7, 9, 4, 4, BRASS_LO)
  rect(image, 5, 13, 8, 2, BRASS)
  px(image, 8, 4, CREAM)
end)

icon("icon-journal", function(image)
  rect(image, 3, 3, 12, 12, BRASS)
  rect(image, 4, 4, 9, 10, STONE1)
  vline(image, 5, 4, 10, CREAM)
  for y = 6, 11, 2 do hline(image, 7, y, 4, BRASS_HI) end
  rect(image, 12, 4, 3, 10, BRASS_LO)
end)

icon("icon-menu", function(image)
  hline(image, 3, 5, 12, BRASS_HI)
  hline(image, 3, 8, 12, BRASS)
  hline(image, 3, 11, 12, BRASS_LO)
  px(image, 2, 5, CREAM)
  px(image, 2, 8, CREAM)
  px(image, 2, 11, CREAM)
end)

-- ---------------------------------------------------------------------------
-- A small decorative divider for the HUD foot
-- ---------------------------------------------------------------------------

local function divider()
  local w, h = 48, 5
  local sprite, image = new_sprite(w, h)
  hline(image, 0, 2, w, BRASS_LO)
  hline(image, 0, 1, w, BRASS)
  px(image, 0, 1, CREAM)
  px(image, w - 1, 1, CREAM)
  px(image, 23, 0, BRASS_HI)
  px(image, 24, 0, BRASS_HI)
  save(sprite, "divider")
end

divider()
