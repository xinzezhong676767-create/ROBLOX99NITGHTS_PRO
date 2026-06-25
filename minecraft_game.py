from ursina import *
from ursina.prefabs.first_person_controller import FirstPersonController


app = Ursina()

window.title = "Simple Minecraft"
window.borderless = False
window.fullscreen = False
window.exit_button.visible = True
window.fps_counter.enabled = True


# -------------------------
# Game settings
# -------------------------
block_pick = 1

block_colors = {
    1: color.green,      # grass
    2: color.gray,       # stone
    3: color.brown,      # dirt
    4: color.orange,     # brick
    5: color.azure,      # blue block
}

block_names = {
    1: "Grass",
    2: "Stone",
    3: "Dirt",
    4: "Brick",
    5: "Blue Block",
}


# -------------------------
# Block class
# -------------------------
class Voxel(Button):
    def __init__(self, position=(0, 0, 0), block_color=color.green):
        super().__init__(
            parent=scene,
            position=position,
            model="cube",
            origin_y=0.5,
            color=block_color,
            highlight_color=color.lime,
            scale=1,
            collider="box",
        )

    def input(self, key):
        global block_pick

        if self.hovered:
            # Break block
            if key == "left mouse down":
                destroy(self)

            # Place block
            if key == "right mouse down":
                new_position = self.position + mouse.normal
                Voxel(
                    position=new_position,
                    block_color=block_colors[block_pick],
                )


# -------------------------
# Create world
# -------------------------
for x in range(-15, 16):
    for z in range(-15, 16):
        Voxel(
            position=(x, 0, z),
            block_color=color.green,
        )


# Add some simple blocks / hills
for y in range(1, 4):
    Voxel(position=(4, y, 4), block_color=color.gray)

Voxel(position=(5, 1, 4), block_color=color.gray)
Voxel(position=(4, 1, 5), block_color=color.gray)

for y in range(1, 5):
    Voxel(position=(-5, y, 3), block_color=color.brown)

Voxel(position=(-5, 5, 3), block_color=color.green)
Voxel(position=(-4, 5, 3), block_color=color.green)
Voxel(position=(-6, 5, 3), block_color=color.green)
Voxel(position=(-5, 5, 4), block_color=color.green)
Voxel(position=(-5, 5, 2), block_color=color.green)


# -------------------------
# Player
# -------------------------
player = FirstPersonController()
player.position = (0, 3, -8)
player.speed = 5
player.gravity = 0.8
player.jump_height = 2


# -------------------------
# Camera / sky
# -------------------------
Sky()


# -------------------------
# UI
# -------------------------
crosshair = Text(
    text="+",
    origin=(0, 0),
    position=(0, 0),
    scale=2,
    color=color.white,
)

instructions = Text(
    text="WASD move | Mouse look | Space jump | Left click break | Right click place | 1-5 choose block | Esc quit",
    position=(-0.78, 0.46),
    scale=0.85,
    background=True,
)

selected_text = Text(
    text="Selected: Grass",
    position=(-0.78, 0.41),
    scale=1,
    background=True,
)


# -------------------------
# Update loop
# -------------------------
def update():
    global block_pick

    if held_keys["1"]:
        block_pick = 1
        selected_text.text = "Selected: Grass"

    if held_keys["2"]:
        block_pick = 2
        selected_text.text = "Selected: Stone"

    if held_keys["3"]:
        block_pick = 3
        selected_text.text = "Selected: Dirt"

    if held_keys["4"]:
        block_pick = 4
        selected_text.text = "Selected: Brick"

    if held_keys["5"]:
        block_pick = 5
        selected_text.text = "Selected: Blue Block"

    if held_keys["escape"]:
        application.quit()


app.run()