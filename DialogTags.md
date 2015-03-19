# Wrapping tags #
A wrapping tag consists of a starting tag and a closing tag. The parameters for the starting tag must be written before the closing curly brace. The closing tag consists of a slash and the tag name within curly braces.

Including any wrapping tag inside another one will not work (nor it makes sense), and nesting tags improperly won't work either.

  * **`{b}`**: The enclosed text is bolded.
  * **`{i}`**: The enclosed text is italicized.
  * **`{u}`**: The enclosed text is underlined.
  * **`{s}`**: The enclosed text is crossed out.
  * **`{sc}`**: The enclosed text is in small capitals.
  * **`{sup}`**: The enclosed text is in superscript.
  * **`{sub}`**: The enclosed text is in subscript.
  * **`{center}`**: The enclosed text is centered.
  * **`{c `_`color`_`}`**: The enclosed text is written in `color` color (either a hex value preceded by #, or a CSS-compliant color name).
  * **`{hilite `_`color`_`}`**: The enclosed text has a `color` background (either a hex value preceded by #, or a CSS-compliant color name).
  * **`{fs `_`size`_`}`**: The enclosed text is written with font size `size` (in points).
  * **`{lsp `_`px`_`}`**: The character spacing for the enclosed text is `px` pixels.

# Stand-alone tags #
Stand-alone tags consist of the tag, its possible parameters, and a slash, all enclosed in curly brackets.

  * **`{ln /}`**: Adds a newline.
  * **`{auto /}`**: Automatically proceeds to the next line, not waiting for user input. (The rest of the line is discarded if used in the middle of a line.)
  * **`{speed `_`delay`_` /}`**: Sets the text speed to display one character every `delay` milliseconds.
  * **`{pause `_`delay`_` /}`**: Waits for `delay` milliseconds before continuing.

# Examples #
```
dialog [Will] "Here's a clue: the person was called {c#c00}Jack Smith{/c}."
dialog [Sharon] "I owe you this one.{ln /}{pause 2000 /}Wait, I wasn't supposed to say that."
```