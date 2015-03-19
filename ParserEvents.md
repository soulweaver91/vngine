Square brackets do **not** imply an optional parameter in the following specification.

# Dialog events: dialog, choice #
**Syntax:** `dialog `_`line`_
> Displays the specified line character in the dialog box.

**Syntax:** `dialog `_`[name] line`_
> Same as the first syntax, but also displays the specified `name` in the name box on the left side.

**Syntax:** `dialog `_`[name]> line`_
> Same as the first syntax, but also displays the specified `name` in the name box on the right side.

**Syntax:** `choice `_`option1;option2;option3;option4;...`_
> Presents the player with a set of choices defined by the `optionX` items. The result is stored into the "choice" local variable.

# Layer setup events: setbg, setchar, clrchar, overlay, fade, clroverlay #
**Syntax:** `setbg `_`duration filename`_
> Changes the current background layer to the image `filename`, using a crossfade effect of `duration` milliseconds.

**Syntax:** `setchar `_`duration filename`_
> Changes the current character layer to the image `filename`, using a crossfade effect of `duration` milliseconds.

**Syntax:** `clrchar `_`duration`_
> Removes the current character layer, using a crossfade effect of `duration` milliseconds.

**Syntax:** `overlay `_`duration filename`_
> Changes the current overlay layer to the image `filename`, using a crossfade effect of `duration` milliseconds.

**Syntax:** `fade `_`color duration destructive`_
> Fades the image out into a solid layer of `color`, using a fade out effect of `duration` milliseconds. If `destructive` is set to 1, all background and character layers are destroyed upon fade completion; other values are ignored. The solid color is considered an overlay.

**Syntax:** `clroverlay `_`duration`_
> Removes the current overlay layers, using a fade out effect of `duration` milliseconds.

# Flow commands: ifvar, else, elif, endif, label, jump, load #
**Syntax:** `ifvar `_`variable value`_
> If the local variable `variable` is equal to `value`, enter the following code branch; otherwise, skip to the next `else`, `elif` or `endif` event on the same code level.

**Syntax:** `else`
> Ends the previous branch started by `ifvar` or `elif` and starts a new one which is only entered if the code didn't enter the previous branch.

**Syntax:** `elif `_`variable value`_
> A combination of `else` and `ifvar`. Works the same way as `ifvar` does.

**Syntax:** `endif`
> Ends the previous branch started by `ifvar`, `else` or `elif`.

**Syntax:** `label `_`labelname`_
> Does nothing at runtime, but is used by the `jump` event.

**Syntax:** `jump `_`labelname`_
> Jump to the specified label `labelname` in the same scene file. _Note: Usage of regular flow control structures is highly favorable over goto-style labels._

**Syntax:** `load `_`filename`_
> Load the scene data from the file `filename`. The currently loaded file will be unloaded from memory.

**Syntax:** `load `_`filename labelname`_
> Load the scene data from the file `filename` and immediately jump to the label `labelname` in it. The currently loaded file will be unloaded from memory.

# Variable events: setvar, setglobal #
**Syntax:** `setvar `_`variable expression`_
> Evaluates the expression `expression` and saves the result to the local variable `variable`. Expressions may contain basic arithmetic operators (addition, subtraction, multiplication, division), parentheses and variable names. Global variables can be accessed by adding an at symbol (@) before the name.

**Syntax:** `setglobal `_`variable expression`_
> Same as `setvar` but for global variables.

# Music events: playmus #
**Syntax:** `playmus `_`filename`_
> Starts playing the music track with the filename `filename`. These are automatically read and set to preload by the parser whenever a new scene file is read.

# Miscellaneous events: ending, title, end, nop #
**Syntax:** `ending `_`filename duration`_
> Fades the screen to white during the course of `duration` milliseconds, starts playing the music track with the filename `filename` and shows the credits from the credits file. After the song has played once, ends playback and initiates the next event.

**Syntax:** `title `_`titletext`_
> Sets the browser tab title to `titletext`.

**Syntax:** `end`
> Halts the execution of the scene script.

**Syntax:** `nop`
> Halts the execution of the scene script; not expected to be used by users, but used internally after certain errors.

# Comments #
Any line beginning, not taking indenting into account, with the hash character (#) is ignored by the parser.