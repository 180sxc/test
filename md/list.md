1. trial
   - basic movements, 
   - techniques and basic skills and hotkeys
   - game mechanics

2. game state levels
   - main game state manager 
       - individual states managed by main manager and appended into the main state queue

3. main game loop
   - requestanimationframe w/ ctx (or settimeout if suitable)

4. event trigger system
   - position-based
   - interaction-based
   - story progression based
   - Time-based

5. Asset loader
   - loads images, sound files, data before stage starts to prevent unloaded graphics

6. event system
   - scans inputs, collisions, triggers, new instances

7. game data
   - player state (hp/state/inventory)
   - npc dialogue, quest direction, dialogue choice etc
   - mobs state (hp/state/atk/def/ai)

8. event handlers
   - dialogue trees with NPC conversations
       - check conditions for change of dialogue
   - puzzle manager
       - puzzle elements (pressure plates/angles/lights)
       - validate combinations / algorithms
       - feedback on incorrect attemps
       - tips when a certain amount of fails
       - requiring specific items to proceed
       - environmental interactions along with event systems
   - cutscenes, scripted or animated
   - quest manager tracking quest completion and changes game state etc.
       - tracks the number of NPC spoken to and which
       - puzzle completion status
       - choices of dialogues

9. user interaction / GUI/ HUD
   - GUI
       - settings screen with visual settings
       -  quest completion tracker
           - shows quest states / objectives -> puzzles
    - HUD
       - displays
       - maps
       - hp
       - stamina
     
10. physics handler
    - acceleration
    - collision resolution
    - knockback
    - terrain 
       - slippery/slow/hazard
       - elevation
       - falling elements
    - hitbox

11. combat system
    - hit detection w/hitbox
    - invincibility frames
    - crit hits
    - weapons
       - cooldowns
       - types
       - animations
    - projectiles

12. saving/loading
    - localstorage save
    - localstorage get
   
13. sfx
    - music system for music fade in and out
    - dynamic battle music
    - UI clicks
    - hits
    - footsteps
    - volume based on distance etc

14. RENDERER
    - rendering
       - sprites
       - environemtns
       - npc
       - special effects