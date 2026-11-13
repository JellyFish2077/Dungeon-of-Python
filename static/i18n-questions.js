/* PyDungeon — английский банк вопросов.
 *
 * Ключ — id вопроса. Формат: [текст, варианты | null, пояснение].
 * null означает «варианты не меняются»: это числа, имена типов и куски
 * кода, которые одинаковы в обоих языках. Варианты-выводы русского кода
 * («меч», «поймали») оставлены как есть — они должны совпадать с кодом
 * в задании.
 */
(function () {
  "use strict";
  if (!window.PyI18n || window.PyI18n.language !== "en") return;

  var EN = {
    1: ["Which command prints text to the screen?", null,
      "print() is the output command. input() does the opposite: it reads data from the keyboard."],
    2: ["Which character starts a comment in Python?", null,
      "A comment starts with #. Python ignores everything after it."],
    3: ["How do you store the value 100 in the variable hp?", null,
      "Assignment uses a single =. A double == is comparison."],
    4: ["What is the type of the value 3.14?", null,
      "A number with a decimal point is a float. int is a whole number, str is a string."],
    5: ["What is the type of the value 100?", null,
      "A whole number without a decimal point is an int."],
    6: ["What will this code print?", null,
      "The + sign adds numbers: 2 + 3 = 5."],
    7: ["What will this code print?", null,
      "The − sign subtracts: 10 − 4 = 6."],
    8: ["What will this code print?", ["Dragon", "dragon", "Error", "\"Dragon\""],
      "print() outputs the text inside the quotes."],
    9: ["What will this code print?", ["2", "3", "4", "Error"],
      "len() counts the length of a string. The word «меч» (sword) has 3 letters."],
    10: ["What will this code print?", null,
      "type() shows the type of a value. 5 is an int."],
    11: ["What will this code print?", null,
      "// is integer division: only the whole part is kept."],
    12: ["What will this code print?", null,
      "% is the remainder of division. 10 = 3 * 3 + 1, so the remainder is 1."],
    13: ["What will this code print?", null,
      "** raises to a power: 2 * 2 * 2 = 8."],
    14: ["What will this code print?", ["dragon", "DRAGON", "Dragon", "Error"],
      "The .upper() method makes all letters uppercase."],
    15: ["What will this code print?", ["15", "105", "10 5", "Error"],
      "Quotes make the values strings, so + joins them: 105."],
    16: ["Which keyword starts the «otherwise» branch?", null,
      "else runs when the if condition is false. elif checks one more condition."],
    17: ["What will this code print?", null,
      "range(3) gives the numbers 0, 1, 2 — the last one is excluded."],
    18: ["What will this code print?", null,
      "append() adds an element to the end of the list."],
    19: ["What will this code print?", null,
      "get() returns the second argument (0) if the key is missing — without an error."],
    20: ["What will this code print?", null,
      "range(2) gives 0 and 1. end=\"\" prints without a newline: 01."],
    21: ["What will this code print?", ["меч", "щит", "зелье", "Error"],
      "Index −1 is the last element of the list."],
    22: ["What will this code print?", ["меч", "чем", "м", "Error"],
      "The slice [::-1] reverses the string: «меч» becomes «чем»."],
    23: ["What does a function return without a return statement?", null,
      "If a function has no return, it returns None."],
    24: ["What will this code print?", ["жив", "поражение", "0", "Nothing"],
      "The condition hp > 0 is false (0 is not greater than 0), so the else branch runs."],
    25: ["What will this code print?", null,
      "An empty collection is falsy — False. A non-empty one is truthy — True."],
    26: ["What will this code print?", null,
      "b = a doesn't copy the list; it points to the same object. So a changes too."],
    27: ["What will this code print?", null,
      "Curly braces without colons make a set. It keeps only unique elements: {1, 2, 3}."],
    28: ["What will this code print?", null,
      "*items collects all arguments into a tuple. There are three, so the result is 3."],
    29: ["Which block always runs, even on an error?", null,
      "The finally block always runs — with or without an error."],
    30: ["What will this code print?", null,
      "Take x from 0 to 3 and keep only the even ones: [0, 2]."],
    31: ["What will this code print?", null,
      "// drops the fractional part: 5 // 2 = 2."],
    32: ["What will this code print?", ["True", "False", "None", "Error"],
      "The and operator is true only when both values are true."],
    33: ["What will this code print?", null,
      "len() returns the number of elements in the list."],
    34: ["What will this code print?", ["п", "подземелье", "ь", "Error"],
      "Index 0 is the first character of the string."],
    35: ["How many times will the loop body run?", null,
      "range(1, 4) gives 1, 2, 3 — three times."],
    36: ["What will this code print?", null,
      "f(3) returns 6, then 6 − 1 = 5."],
    37: ["What will this code print?", null,
      "There is no key c, so get() returns the second argument — 9."],
    38: ["What will this code print?", null,
      "7 % 2 = 1, and 1 == 1 is true, so True."],
    39: ["What will this code print?", null,
      "i takes 0, 1, 2 and each is squared: [0, 1, 4]."],
    40: ["Which construct catches errors at runtime?", null,
      "try/except catches exceptions and keeps the program from crashing."],
    41: ["What does the input() command do?",
      ["Reads text from the keyboard", "Prints text to the screen",
        "Closes the program", "Creates a variable"],
      "input() waits for user input and returns a string."],
    42: ["What will this code print?", null,
      "The − sign subtracts: 7 − 4 = 3."],
    43: ["What will this code print?", null,
      "The * sign multiplies: 3 * 4 = 12."],
    44: ["What is the type of the value True?", null,
      "True and False are the boolean type bool."],
    45: ["What is the type of the value \"100\"?", null,
      "Quotes make the value a string str, even if it contains digits."],
    46: ["What will this code print?", ["52", "7", "Error", "5"],
      "int(\"5\") turns the string into the number 5, then 5 + 2 = 7."],
    47: ["What will this code print?", ["10!", "11", "Error", "10 !"],
      "str(10) turns the number into a string, then the strings are joined: 10!."],
    48: ["What will this code print?", ["д", "о", "н", "Error"],
      "Index 0 is the first character of the string."],
    49: ["What will this code print?", ["хахаха", "ха ха ха", "9", "Error"],
      "Multiplying a string by a number repeats it: хахаха."],
    50: ["What will this code print?", ["True", "False", "5", "\"5\""],
      "== compares values. They are equal, so True."],
    51: ["What will this code print?", ["True", "False", "34", "7"],
      "!= means «not equal». 3 and 4 are different, so True."],
    52: ["What will this code print?", ["True", "False", "TrueFalse", "Error"],
      "Both comparisons are true, and and requires both to be true."],
    53: ["What will this code print?", ["True", "False", "None", "0"],
      "not flips the value: not False is True."],
    54: ["What will this code print?", ["повержен", "жив", "-50", "Error"],
      "After the damage hp = −50. The condition hp < 0 is true."],
    55: ["What will this code print?", ["меч", "щит", "зелье", "Error"],
      "Numbering starts at zero, so [1] is the second element."],
    56: ["What will this code print?", null,
      "len() counts the elements in the list. There are two."],
    57: ["What will this code print?", ["True", "False", "\"щит\"", "1"],
      "The in operator checks whether an element is in the list."],
    58: ["What will this code print?", ["герой", "ГЕРОЙ", "Герой", "Error"],
      "The .lower() method makes all letters lowercase."],
    59: ["How many lines will this code print?", null,
      "The loop walks over each letter. The word «орк» has 3 letters."],
    60: ["What will this code print?", null,
      "x += 3 is shorthand for x = x + 3."],
    61: ["What will this code print?", null,
      "The slice [0:2] takes elements 0 and 1; the last one is excluded."],
    62: ["What will this code print?", null,
      "After two append() calls the list has two elements."],
    63: ["What will this code print?", null,
      "The in operator checks whether a key is in the dictionary."],
    64: ["What will this code print?", null,
      "A tuple is read by index just like a list."],
    65: ["What will this code print?", null,
      "sorted() returns the list in ascending order."],
    66: ["What will this code print?", null,
      "The .split() method cuts the string by a separator into a list."],
    67: ["What will this code print?", null,
      "The .join() method glues a list together with the given separator."],
    68: ["How many lines will this code print?", null,
      "The while loop repeats while i < 3: for 0, 1 and 2."],
    69: ["What will this code print?", null,
      "break stops the loop when i becomes 2."],
    70: ["What will this code print?", null,
      "If the argument isn't passed, the default value 10 is used."],
    71: ["What will print(x) output?", null,
      "The function prints «удар» but returns None, which is what gets stored in x."],
    72: ["What will this code print?", ["True", "False", "\"орк\"", "0"],
      "A non-empty string is considered true."],
    73: ["What will this code print?", ["True", "False", "\"0\"", "None"],
      "The number 0 is considered false."],
    74: ["What will this code print?", null,
      "Python checks the chain: 2 is less than 5 and 5 is less than 10."],
    75: ["What will this code print?", null,
      "The .remove() method deletes the first occurrence of the value."],
    76: ["What will this code print?", null,
      "The variable x inside the function is local; the outer one doesn't change."],
    77: ["What happens when this runs?",
      ["TypeError: a tuple can't be changed", "It becomes [5, 2]",
        "Nothing changes", "ValueError"],
      "A tuple is immutable; its elements can't be assigned."],
    78: ["What will this code print?", null,
      "Checking for None is usually done with is."],
    79: ["Which error will occur?",
      ["ValueError", "TypeError", "0", "No error"],
      "The string «abc» can't be turned into a number — that's a ValueError."],
    80: ["Which error will occur?",
      ["IndexError", "KeyError", "None", "No error"],
      "There is no index 5 in the list — IndexError."],
    81: ["What will this code print?", null,
      "lambda creates a short function: 4 * 2 = 8."],
    82: ["What will this code print?",
      ["True", "False", "0.30000000000000004", "Error: isclose doesn't exist"],
      "0.1 + 0.2 isn't exactly 0.3 because of binary fractions, but math.isclose compares with a tolerance and returns True."],
    83: ["What will this code print?", null,
      "The slice a[:] creates a copy of the list, so a doesn't change."],
    84: ["What will this code print?", null,
      "continue skips the iteration when i equals 1."],
    85: ["What will this code print?",
      ["Привет, {name}!", "Привет, Герой!", "Привет, name!", "Error"],
      "The f before the string substitutes variable values from the curly braces."],
    86: ["What will this code print?", null,
      "A module is first imported, then its functions are called with a dot. sqrt() returns a float, so 4.0, not 4."],
    87: ["What does the line from math import sqrt do?",
      ["Imports only sqrt: call it as sqrt(25)", "Imports the whole math module",
        "Renames sqrt to math", "You can't write it that way"],
      "from module import name takes one name from the module, and you call it without a dot. A plain import math loads the whole module."],
    88: ["How do you install a third-party package such as requests?", null,
      "pip is the package installer: pip install requests installs the package from PyPI, after which it's imported with import requests."],
    89: ["What does the block if __name__ == \"__main__\": do?",
      ["Runs only when the file is started directly, not when imported",
        "Always runs", "Declares a function called main", "Restarts the file"],
      "When run directly, __name__ is \"__main__\"; when imported, it's the module name. The block protects the startup code: someone else's import won't run it."],
    90: ["What will this code print?",
      ["TypeError: a string can't be changed", "Герой", "герой", "An empty string"],
      "A string is immutable, so assigning by index raises TypeError. The needed string is built anew: name = \"Г\" + name[1:]."],
    91: ["What will this code print?",
      ["['меч'] and ['меч', 'щит']", "['меч'] and ['щит']",
        "['меч', 'щит'] in both calls", "Error: a list as an argument"],
      "The default value is created once, when the function is defined, so the same list is used in every call. Safe: bag=None, then inside if bag is None: bag = []."],
    92: ["What happens when this code runs?",
      ["IndentationError: print must be indented", "It prints «да»",
        "It prints True", "It prints nothing"],
      "The body of if is defined by indentation. Without it print isn't part of the block, and Python raises IndentationError."],
    93: ["What will this code print?",
      ["2 1", "1 2", "1 1", "Error: you can't do that"],
      "On the right, the tuple (b, a) is evaluated first, then unpacked into a and b. So the values swap."],
    94: ["What will this code print?",
      ["много", "мало", "True", "Syntax error"],
      "The conditional expression picks a value: x > 5 is true, so «много» is used."],
    95: ["What's wrong with this code?",
      ["SyntaxError: the parenthesis isn't closed", "NameError: no print",
        "TypeError: the string doesn't fit", "The code runs and prints привет"],
      "print is missing a closing parenthesis. Python can't parse the line and raises SyntaxError before running anything."],
    96: ["What happens when this runs?",
      ["ZeroDivisionError", "It prints 0", "It prints 10", "SyntaxError"],
      "You can't divide by zero: Python raises ZeroDivisionError. Division should be guarded with a condition or try/except."],
    97: ["What happens when this runs?",
      ["ValueError: the string can't be turned into a number",
        "It prints 12", "It prints 12a", "TypeError: int isn't a function"],
      "int() understands only a string made entirely of digits. «12a» contains a letter, so ValueError is raised."],
    98: ["What will this code print?", null,
      "def creates a function, and answer() calls it. return 42 returns the number, and print outputs 42."],
    99: ["What will this code print?", null,
      "2 and 3 are passed into the function: a=2, b=3. return gives their sum 5, and print outputs it."],
    100: ["What will this code print?",
      ["привет, мир", "привет, name", "Error: name wasn't passed", "None"],
      "The parameter name has the default value «мир». When called without an argument, that value is used."],
    101: ["What will this code print?",
      ["7.0", "7", "49", "Error: sqrt is not imported"],
      "import math loads the module, and math.sqrt(49) calls a function from it. sqrt returns a float — 7.0."],
    102: ["What will this code print?",
      ["3.14", "3.1", "3.14159", "Error: pi is not a number"],
      "from math import pi takes only the number pi. round(pi, 2) rounds to two decimal places — 3.14."],
    103: ["What will this code print?", ["о", "к", "т", "кот"],
      "Indexes start at zero: word[0] is «к», word[1] is «о», word[2] is «т»."],
    104: ["What will this code print?", ["ребёнок", "взрослый", "12", "Nothing"],
      "12 is less than 18, so the condition is false and the else branch runs — «ребёнок»."],
    105: ["What will this code print?", null,
      "len() returns the number of elements in the list. There are three numbers, so 3."],
    106: ["What will this code print?", null,
      "Exponentiation goes right to left: first 3 ** 2 = 9, then 2 ** 9 = 512."],
    107: ["What will this code print?", null,
      "split(\",\") returns the list ['a', 'b', 'c'], and index [1] takes the second element — b."],
    108: ["What will this code print?",
      ["7", "43", "3", "Error: += doesn't exist"],
      "x += 3 is shorthand for x = x + 3. 3 is added to 4, giving 7."],
    109: ["What will this code print?",
      ["a-b", "a b", "ab", "Error: sep doesn't exist"],
      "The sep parameter sets the separator between print arguments. By default it's a space; here it's a hyphen."],
    110: ["What will this code print?",
      ["7", "34", "3 4", "Error: can't unpack a tuple"],
      "The tuple (3, 4) is unpacked into x and y: x=3, y=4. The sum is 7."],
    111: ["What will this code print?",
      ["10", "5", "15", "Error: x isn't visible"],
      "Assigning x = 5 inside the function creates a local variable. The global x stays 10; to change it you need global x."],
    112: ["What will this code print?",
      ["6", "3", "33", "Error: := doesn't exist"],
      "The := (walrus) operator assigns a value and returns it at once. n becomes 3, so the expression gives 3 + 3 = 6."],
    113: ["What will this code print?",
      ["True", "False", "Error: two comparison operations", "1"],
      "In Python comparisons can be chained: 1 < 2 < 3 means (1 < 2) and (2 < 3). Both are true."],
    114: ["What happens when this runs?",
      ["NameError: the variable score is not defined", "It prints 0",
        "It prints score", "SyntaxError: missing parentheses"],
      "Python looks for score among the variables and doesn't find it. Until the variable exists, referring to it raises NameError."],
    115: ["What happens when this runs?",
      ["TypeError: a string and a number can't be added", "It prints 10",
        "It prints 55", "ValueError: the string isn't a number"],
      "For a string, + means concatenation, and the number 5 isn't a string. Python doesn't guess that 5 should become \"5\", so it raises TypeError."],
    116: ["What happens when this runs?",
      ["IndexError: there is no index 3 in the list", "It prints 2",
        "It prints 3", "It prints None"],
      "The indexes of a two-element list are 0 and 1. items[3] goes out of bounds and raises IndexError."],
    117: ["What happens when this runs?",
      ["KeyError: there is no key gold", "It prints 10",
        "It prints None", "It prints 0"],
      "The dictionary has only the key hp. Referring to a missing key raises KeyError; safer is hero.get(\"gold\")."],
    118: ["What will this code print?",
      ["поймали", "ZeroDivisionError", "0", "Nothing"],
      "Division by zero is caught by except ZeroDivisionError, so the program doesn't crash and prints «поймали»."],
    119: ["What will this code print?",
      ["ок", "ошибка", "5", "Nothing"],
      "There was no exception, so the except block is skipped and else runs — «ок» is printed."],
    120: ["What will this code print?",
      ["привет", "hello", "None", "Error: the function isn't called"],
      "def declares a function, and hello() calls it. Inside there's a print, so the screen shows «привет»."],
    121: ["What will this code print?", null,
      "4 is passed into the function: x=4. return gives 4 * 4 = 16, and print outputs it."],
    122: ["What will this code print?",
      ["привет, Аня", "привет, name", "Аня", "None"],
      "The argument «Аня» goes into the parameter name. The function joins the strings and returns «привет, Аня»."],
    123: ["What will this code print?", ["3", "4", "3.7", "Error: floor is not imported"],
      "import math loads the module, and math.floor() rounds down to a whole number. For 3.7 that's 3."],
    124: ["What will this code print?", null,
      "from math import ceil takes only the ceil function from the module. It rounds up: 2.1 becomes 3."],
    125: ["What will this code print?", null,
      "import math as m gives the module the short name m. Then its functions are called through m, and sqrt returns a float — 6.0."],
    126: ["What will this code print?", null,
      "math.pow(2, 3) raises 2 to the third power and returns a float: 8.0, not 8."],
    127: ["What will this code print?", null,
      "First % and ** run: 10 % 4 = 2, 2 ** 2 = 4. Then addition: 2 + 4 = 6."],
    128: ["What will this code print?", ["к", "о", "т", "кот"],
      "Indexes start at zero: [0] is the first character of the string, «к»."],
    129: ["What will this code print?",
      ["дада", "да да", "2", "Error: a string can't be multiplied"],
      "Multiplying a string by a number repeats it: «да» * 2 gives «дада»."],
    130: ["What will this code print?", null,
      "The slice [1:4] takes characters with indexes 1 through 3: b, c, d."],
    131: ["What will this code print?", ["плюс", "3", "True", "Nothing"],
      "3 is greater than zero, so the condition is true and the if body runs — «плюс» is printed."],
    132: ["What will this code print?", ["нет", "да", "0", "Nothing"],
      "Zero counts as false in a condition, so the else branch runs — «нет» is printed."],
    133: ["What will this code print?", null,
      "List indexes start at zero: [0] is 10, [1] is 20, [2] is 30."],
    134: ["What will this code print?", ["меч", "щит", "0", "['меч', 'щит']"],
      "The first element of the list has index 0. So items[0] is «меч»."],
    135: ["What will this code print?", null,
      "bool is a subclass of int: True and False behave like 1 and 0. So isinstance(True, int) returns True."],
    136: ["What indentation per nesting level does PEP 8 require?",
      ["Four spaces", "One tab character", "Two spaces", "No indentation"],
      "PEP 8 requires four spaces per level. Python accepts other indents if they're consistent within a block, but you must never mix spaces and tabs."],
    137: ["What will this code print?",
      ["Урон: 15", "Урон:15", "Урон:,15", "Error: comma inside print"],
      "print takes several arguments and by default separates them with a space (sep=\" \"). So a space appears between the colon and the number."],
    138: ["What will this code print?",
      ["HP: 10", "HP: {hp}", "HP: hp", "Error: there is no f before a string"],
      "The f before the quotes makes it an f-string: the name in curly braces is replaced with its value."],
    139: ["What will this code print?",
      ["6", "3", "33", "Error: you can't assign like that"],
      "Assignment goes right to left: both names get the same value 3, so 3 + 3 = 6."],
    140: ["What will this code print?",
      ["3", "4", "3.9", "Error: float can't be turned into int"],
      "int() drops the fractional part instead of rounding: int(3.9) is 3. To round to the nearest whole number, use round()."],
    141: ["What will this code print?",
      ["True", "False", "1", "Error: int and float can't be compared"],
      "Python compares numbers by value, not by type: 1 and 1.0 are equal, so the result is True."],
    142: ["What will this code print?", null,
      "// gives the integer part of the division: 7 // 2 = 3. % gives the remainder: 7 % 2 = 1. print with a comma outputs both values separated by a space."],
    143: ["What will this code print?", null,
      "Fractions are stored approximately: 0.1 + 0.2 gives 0.30000000000000004, not exactly 0.3, so the comparison is False. For such cases there's math.isclose()."],
    144: ["What will this code print?", null,
      "The function returns 7, and the call can be used as a number: 7 + 7 = 14."],
    145: ["What will this code print?", null,
      "The call returns 15, and that value is stored in hp. The parameter inside the function is a separate name; by itself it doesn't change the outer variable."],
    146: ["What will this code print?",
      ["4", "-4", "6", "Error: arguments passed out of order"],
      "Named arguments are bound by name, not by order: a = 5, b = 1, so 5 − 1 = 4."],
    147: ["What will this code print?",
      ["3", "4", "(3, 4)", "Error: the function returned two values"],
      "return 3, 4 returns a tuple of two numbers. It's unpacked into atk and hp, so atk = 3."],
    148: ["Which error will occur?",
      ["TypeError", "ValueError", "NameError", "No error: it becomes «меч5»"],
      "You can't add a string and a number: Python doesn't guess that 5 should become \"5\". That's TypeError; you need str(5) first."],
    149: ["What happens when this runs?",
      ["NameError: there is no name hpp", "TypeError: hpp isn't a number",
        "It prints 10", "It prints None"],
      "There's a typo in the name: the variable hpp is never defined. Python looks up names at runtime and fails with NameError."],
    150: ["What will this code print?",
      ["«спас», then «конец» — two lines", "only «спас»", "only «конец»",
        "The error isn't caught, the program crashes"],
      "except catches ZeroDivisionError and prints «спас», and finally always runs — afterwards «конец» is printed."],
    151: ["What will this code print?",
      ["не число", "Traceback: ValueError", "0", "abc"],
      "int() can't turn «abc» into a number and raises ValueError. except catches it, so the screen shows «не число»."],
    152: ["What will this code print?",
      ["-3", "-2", "-2.5", "Error: floor doesn't take negatives"],
      "math.floor() rounds down along the number line, not toward zero: −2.5 → −3. For rounding toward zero there's int(); for the nearest whole number, round()."],
    153: ["What will this code print?",
      ["1", "0", "Error: the bounds must differ", "A random number from 0 to 1"],
      "randint(a, b) returns a whole number from a to b inclusive. When a and b are equal there's nothing to choose from — always 1."],
    154: ["What will this code print?", null,
      "math.sqrt() always returns a float, even when the root is whole: sqrt(16) is 4.0, type float."],
    155: ["What will this code print?", null,
      "math.sqrt(17) is about 4.123, and math.ceil() rounds up to a whole number: 5. Nested calls run from the inside out."]
  };

  if (typeof QUESTIONS === "undefined") return;
  // Код заданий тоже переводим: иначе в английском бою всплывает
  // print("Дракон"), а варианты ответа уже английские. Для таких
  // заданий меняем и код, и варианты, и пояснение — они связаны.
  var FIX = {
    8: { code: "print(\"Dragon\")" },
    9: {
      code: "print(len(\"sword\"))",
      options: ["4", "5", "6", "Error"],
      explanation: "len() counts the length of a string. The word “sword” has 5 letters."
    },
    14: { code: "print(\"dragon\".upper())" },
    18: {
      code: "inventory = [\"sword\"]\ninventory.append(\"shield\")\nprint(inventory)",
      options: ["[\"sword\"]", "[\"sword\", \"shield\"]", "[\"shield\", \"sword\"]", "Error"]
    },
    19: { options: ["None", "0", "100", "Error"] },
    21: {
      code: "loot = [\"sword\", \"shield\", \"potion\"]\nprint(loot[-1])",
      options: ["sword", "shield", "potion", "Error"]
    },
    22: {
      code: "print(\"sword\"[::-1])",
      options: ["sword", "drows", "s", "Error"],
      explanation: "The slice [::-1] reverses the string: “sword” becomes “drows”."
    },
    23: { options: ["0", "None", "10", "Error"] },
    24: {
      code: "hp = 0\nif hp > 0:\n    print(\"alive\")\nelse:\n    print(\"defeat\")",
      options: ["alive", "defeat", "0", "Nothing"]
    },
    25: { options: ["True", "False", "None", "Error"] },
    26: { options: ["[1, 2]", "[1, 2, 3]", "[3]", "Error"] },
    27: { options: ["4", "3", "2", "Error"] },
    28: {
      code: "def loot(*items):\n    return len(items)\n\nprint(loot(\"sword\", \"shield\", \"potion\"))",
      options: ["1", "3", "Error", "None"]
    },
    33: { options: ["3", "4", "5", "Error"] },
    34: {
      code: "print(\"dungeon\"[0])",
      options: ["d", "dungeon", "n", "Error"]
    },
    37: { options: ["None", "9", "1", "Error"] },
    48: {
      code: "print(\"dragon\"[0])",
      options: ["d", "o", "n", "Error"]
    },
    49: {
      code: "print(\"ha\" * 3)",
      options: ["hahaha", "ha ha ha", "9", "Error"],
      explanation: "Multiplying a string by a number repeats it: hahaha."
    },
    54: {
      code: "hp = 100\nhp = hp - 150\nif hp < 0:\n    print(\"defeated\")\nelse:\n    print(\"alive\")",
      options: ["defeated", "alive", "-50", "Error"]
    },
    55: {
      code: "print([\"sword\", \"shield\", \"potion\"][1])",
      options: ["sword", "shield", "potion", "Error"]
    },
    57: {
      code: "print(\"shield\" in [\"sword\", \"shield\"])",
      options: ["True", "False", "\"shield\"", "1"]
    },
    58: {
      code: "print(\"Hero\".lower())",
      options: ["hero", "HERO", "Hero", "Error"]
    },
    59: {
      code: "for letter in \"orc\":\n    print(letter)",
      explanation: "The loop goes through each letter. The word “orc” has 3 letters."
    },
    61: {
      code: "print([\"sword\", \"shield\", \"potion\"][0:2])",
      options: ["[\"sword\"]", "[\"sword\", \"shield\"]", "[\"shield\", \"potion\"]", "[\"sword\", \"shield\", \"potion\"]"]
    },
    62: {
      code: "inventory = []\ninventory.append(\"sword\")\ninventory.append(\"shield\")\nprint(len(inventory))"
    },
    64: { options: ["10", "20", "(10, 20)", "Error"] },
    66: {
      code: "print(\"sword,shield\".split(\",\"))",
      options: ["swordshield", "['sword', 'shield']", "sword, shield", "Error"]
    },
    67: { options: ["ab", "a-b", "a, b", "Error"] },
    70: { options: ["100", "110", "10", "Error"] },
    71: {
      code: "def attack():\n    print(\"hit\")\n\nx = attack()\nprint(x)",
      options: ["hit", "None", "0", "Error"],
      explanation: "The function prints “hit” but returns None, which is stored in x."
    },
    72: {
      code: "print(bool(\"orc\"))",
      options: ["True", "False", "\"orc\"", "0"]
    },
    74: { options: ["True", "False", "25", "Error"] },
    76: { options: ["5", "10", "None", "Error"] },
    78: { options: ["True", "False", "None", "Error"] },
    81: { options: ["6", "8", "f(4)", "Error"] },
    83: { options: ["3", "4", "[1, 2, 3, 4]", "Error"] },
    85: {
      code: "name = \"Hero\"\nprint(f\"Hello, {name}!\")",
      options: ["Hello, {name}!", "Hello, Hero!", "Hello, name!", "Error"]
    },
    86: { options: ["4.0", "4", "16", "Error: math is not imported"] },
    89: { code: "if __name__ == \"__main__\":\n    print(\"start\")" },
    90: {
      code: "name = \"hero\"\nname[0] = \"H\"\nprint(name)",
      options: ["TypeError: a string cannot be changed", "Hero", "hero", "An empty string"],
      explanation: "A string is immutable, so assigning by index raises TypeError. Build the needed string anew: name = \"H\" + name[1:]."
    },
    91: {
      code: "def add(item, bag=[]):\n    bag.append(item)\n    return bag\n\nprint(add(\"sword\"))\nprint(add(\"shield\"))",
      options: ["['sword'] and ['sword', 'shield']", "['sword'] and ['shield']",
        "['sword', 'shield'] in both calls", "Error: a list in the argument"]
    },
    92: {
      code: "if True:\nprint(\"yes\")",
      options: ["IndentationError: print must be indented to the right",
        "It prints “yes”", "It prints True", "It prints nothing"]
    },
    94: {
      code: "x = 10\nprint(\"many\" if x > 5 else \"few\")",
      options: ["many", "few", "True", "Syntax error"],
      explanation: "The ternary expression picks a value: the condition x > 5 is true, so “many” is chosen."
    },
    95: {
      code: "print(\"hello\"",
      options: ["SyntaxError: the parenthesis is not closed", "NameError: print doesn't exist",
        "TypeError: the string doesn't fit", "The code will run and print hello"]
    },
    98: { options: ["42", "answer", "None", "Error: the function is not called"] },
    100: {
      code: "def greet(name=\"world\"):\n    return \"hello, \" + name\n\nprint(greet())",
      options: ["hello, world", "hello, name", "Error: name is not passed", "None"],
      explanation: "The parameter name has the default value “world”. It is used when the function is called without an argument."
    },
    103: {
      code: "word = \"cat\"\nprint(word[1])",
      options: ["a", "c", "t", "cat"],
      explanation: "Indexes start at zero: word[0] is “c”, word[1] is “a”, word[2] is “t”."
    },
    104: {
      code: "age = 12\nif age >= 18:\n    print(\"adult\")\nelse:\n    print(\"child\")",
      options: ["child", "adult", "12", "Nothing"],
      explanation: "12 is less than 18, so the condition is false and the else branch runs — “child”."
    },
    118: {
      code: "try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print(\"caught\")",
      options: ["caught", "ZeroDivisionError error", "0", "Nothing"],
      explanation: "Division by zero is caught by except ZeroDivisionError, so the program does not crash and prints “caught”."
    },
    119: {
      code: "try:\n    x = 10 / 2\nexcept ZeroDivisionError:\n    print(\"error\")\nelse:\n    print(\"ok\")",
      options: ["ok", "error", "5", "Nothing"],
      explanation: "There was no exception, so the except block is skipped and else runs — “ok” is printed."
    },
    120: {
      code: "def hello():\n    print(\"hello\")\n\nhello()",
      options: ["hello", "Hello", "None", "Error: the function is not called"],
      explanation: "def declares the function, and the line hello() calls it. Inside there is print, so the screen shows “hello”."
    },
    122: {
      code: "def greet(name):\n    return \"hello, \" + name\n\nprint(greet(\"Anna\"))",
      options: ["hello, Anna", "hello, name", "Anna", "None"],
      explanation: "The argument “Anna” goes into the parameter name. The function joins the strings and returns “hello, Anna”."
    },
    124: { options: ["3", "2", "2.1", "Error: ceil is not imported"] },
    125: { options: ["6.0", "6", "36", "Error: m is not a module"] },
    128: {
      code: "print(\"cat\"[0])",
      options: ["c", "a", "t", "cat"],
      explanation: "Indexes start at zero: [0] is the first character of the string, that is “c”."
    },
    129: {
      code: "print(\"yes\" * 2)",
      options: ["yesyes", "yes yes", "2", "Error: a string cannot be multiplied"],
      explanation: "Multiplying a string by a number repeats it: “yes” * 2 gives “yesyes”."
    },
    131: {
      code: "x = 3\nif x > 0:\n    print(\"plus\")",
      options: ["plus", "3", "True", "Nothing"],
      explanation: "3 is greater than zero, so the condition is true and the if body runs — “plus” is printed."
    },
    132: {
      code: "x = 0\nif x:\n    print(\"yes\")\nelse:\n    print(\"no\")",
      options: ["no", "yes", "0", "Nothing"],
      explanation: "Zero counts as false in a condition, so the else branch runs — “no” is printed."
    },
    133: { options: ["30", "20", "10", "Error: a list has no indexes"] },
    134: {
      code: "items = [\"sword\", \"shield\"]\nprint(items[0])",
      options: ["sword", "shield", "0", "['sword', 'shield']"],
      explanation: "The first element of the list has index 0. So items[0] is “sword”."
    },
    137: {
      code: "print(\"Damage:\", 15)",
      options: ["Damage: 15", "Damage:15", "Damage:,15", "Error: a comma inside print"]
    },
    143: { options: ["False", "True", "0.3", "Error"] },
    148: {
      code: "print(\"sword\" + 5)",
      options: ["TypeError", "ValueError", "NameError", "No error: it becomes “sword5”"]
    },
    150: {
      code: "try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print(\"saved\")\nfinally:\n    print(\"end\")",
      options: ["“saved”, then “end” — two lines", "only “saved”", "only “end”",
        "The error isn't caught, the program crashes"],
      explanation: "except catches ZeroDivisionError and prints “saved”, and finally always runs — afterwards “end” is printed."
    },
    151: {
      code: "try:\n    int(\"abc\")\nexcept ValueError:\n    print(\"not a number\")",
      options: ["not a number", "Traceback: ValueError", "0", "abc"],
      explanation: "int() can't turn “abc” into a number and raises ValueError. except catches it, so the screen shows “not a number”."
    },
    154: { options: ["<class 'float'>", "<class 'int'>", "4", "Error: sqrt is not imported"] }
  };

  QUESTIONS.forEach(function (q) {
    if (q.generated) return;
    var en = EN[q.id];
    if (!en) return;
    q.text = en[0];
    if (en[1]) q.options = en[1];
    q.explanation = en[2];
    var fix = FIX[q.id];
    if (!fix) return;
    if (fix.code !== undefined) q.code = fix.code;
    if (fix.options) q.options = fix.options;
    if (fix.explanation) q.explanation = fix.explanation;
  });

  // Названия тем видны в разборе после боя, в журнале и на доске практики.
  if (typeof TOPICS !== "undefined" && TOPICS) {
    var topicsEn = {
      syntax: "Syntax and basics",
      types: "Data types",
      operators: "Operators and expressions",
      strings: "Strings",
      control: "Conditions and loops",
      collections: "Lists, dicts, sets",
      functions: "Functions",
      errors: "Exceptions",
      modules: "Modules and imports"
    };
    Object.keys(topicsEn).forEach(function (key) {
      if (TOPICS[key]) TOPICS[key] = topicsEn[key];
    });
  }
})();
