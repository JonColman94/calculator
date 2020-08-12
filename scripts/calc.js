let funcMap = new Map([
    ["+", { precedence: 2, func: (a,b) => {return parseFloat(a) + parseFloat(b);}}],
    ["-", { precedence: 2, func: (a,b) => {return parseFloat(a) - parseFloat(b);}}],
    ["*", { precedence: 3, func: (a,b) => {return parseFloat(a) * parseFloat(b);}}],
    ["/", { precedence: 3, func: (a,b) => {return (parseFloat(b) == 0) ? "DIV0 ERROR" : parseFloat(a) / parseFloat(b);}}],
    ["^", { precedence: 4, func: (a,b) => {return parseFloat(a) ** parseFloat(b);}}],
    ["(", { precedence: -1}],
    [")", { precedence: -1}]
]);

let HistoryQueue = function() {
    this.div = document.querySelector("#history-div");
    this.queue = [];
    this.queue_max_length = 5;

    this.push = function(value) {
        if (this.queue.length == 5) {
            old_history = this.queue.shift();
            this.div.removeChild(old_history);
        }
        new_history = document.createElement("div");
        new_history.classList.add("history");
        new_history.innerText = value;
        this.div.appendChild(new_history);
        this.queue.push(new_history);
    }
}

let EquationContext = function() {
    this.textbox = document.querySelector("#equation");
    this.parentheses_count = 0;
    this.history = new HistoryQueue();
    this.evaluated = false;

    this.undo = function() {
        let text = this.textbox.value;
        let end = text.charAt(text.length-1);
        text = text.substring(0, text.length-1);
        this.textbox.value = text;
        this.parentheses_count += (end == "(") ? -1 : ((end == ")") ? 1 : 0);
    }

    this.reset = function() {
        this.parentheses_count = 0;
        this.textbox.value = "";
    }

    this.push = function(char) {
        let text = this.textbox.value;
        if (text.match(/ERROR/)) text = "";
        switch (char) {
            case ".":
                if (text.match(/^.*[\+\/\*\-\^\(]$/) || text.length == 0 || this.evaluated) { //If string ends in operator or open parenthesis, 0.x
                    text += "0.";
                    break;
                }
                else if (text.match(/^((.*)([\+\/\*\-\^\(]))?(\d+)$/)) {    //If placing a decimal place
                    text += char;
                    break;
                }
                break;
            case "(":
                if (text.match(/^(.*)((\d)|\))+$/)) {                       //If string ends in a digit or closing parenthesis, multiply
                    text += "*("
                    this.parentheses_count++;
                    break;
                }
                else if (text.match(/^.*[^\.]$/) || text.length == 0) {     //If string does not end in a decimal place
                    text += char
                    this.parentheses_count++;
                    break;
                }
                break;
            case ")":
                if (this.parentheses_count > 0) {
                    if (text.match(/^.*[^\.\+\/\*\-\^\(]$/)) {               //If string does not end in operator or open parenthesis
                        text += char
                        this.parentheses_count--;
                        break;
                    }
                }
                break;
            default:
                if (isNaN(char)) {
                    if (text.match(/^.*[^\.\()]$/)) {                        //If string does not end in decimal point or open bracket
                        if (text.match(/^.*[\+\/\*\-\^]$/)) 
                            text = text.substring(0, text.length-1);
                        text += char
                        break;
                    }
                } else {
                    if (text.match(/^.*[^\)]$/) || text.length == 0) {
                        text = (this.evaluated) ? char : (text + char);
                        break;
                    }
                }
        }
        this.textbox.value = text;
        this.evaluated = false;
    }

    this.evaluate = function() {
        this.parentheses_count == 0
        let eq = this.textbox.value;
        let text = evaluateInfix(eq);
        this.history.push(`${eq} \t ${text}`);
        this.textbox.value = text;
        this.evaluated = true;
    }
}

ec = new EquationContext();
setListeners();

function convertInfixToPostfix(infix) {
    let out = [];
    let num = "";
    let stack = [];

    let prev = ""

    Array.from(infix).forEach(c => {
        if (!isNaN(c) || c == ".") num += c;    //Assemble floating point operands
        else {                                  //Process operators
            if (num) { out.push(num); num = ""; }
            if (c == "(") {
                if (!isNaN(prev)) stack.push("*");
                stack.push(c);
            }
            else if (c == ")") { 
                let head = "";
                while ((head = stack.pop()) != "(") out.push(head);
            } else {
                let head = stack[stack.length-1];
                let precedence = funcMap.get(c).precedence;
                if (stack.length == 0 || head == "(" || precedence > funcMap.get(head).precedence) {
                    stack.push(c);
                } else {
                    while (funcMap.get(head).precedence >= precedence || (head != "(" && head != ")")) {
                        out.push(stack.pop());
                        head = stack[stack.length-1];
                        if (!head) break;
                    }
                    stack.push(c);
                }
            }
        }
        prev = c;
    });
    if (num) out.push(num);
    while (stack.length > 0) out.push(stack.pop());
    return out;
}

function evaluatePostfix(postfix) {
    let stack = []
    postfix.forEach(c => {
        if (!isNaN(c)) stack.push(c);
        else {
            let op2 = stack.pop();
            let op1 = stack.pop();
            let res = operate(c, op1, op2);
            stack.push(res); 
        }
    });
    return stack[0];
}

function evaluateInfix(infix) {
    return evaluatePostfix(convertInfixToPostfix(infix));
}

function operate(operator, op1, op2) {
    if (op1 == "DIV0 ERROR" || op2 == "DIV0 ERROR") return "DIV0 ERROR";
    else return funcMap.get(operator).func(op1, op2);
}

function insertNumButtonPress() {
    ec.push(this.innerText);
}

function insertFuncButtonPress() {
    let innerText = this.innerText;
    if (funcMap.has(innerText)) ec.push(innerText);
    else if (this.id == "square") {
        ec.push("^");
        ec.push("2");
    }
    else if (this.id == "undo") ec.undo();
    else if (this.id == "clear") ec.reset();
    else if (this.id == "equals") ec.evaluate();

}

function setListeners() {
    // Predict mobile use
    let isMobile = window.matchMedia("only screen and (max-width: 760px").matches;
    let numkeys = document.querySelector("#num-keys");
    Array.from(numkeys.childNodes).forEach(x => { 
                (!isMobile) ? x.addEventListener("click", insertNumButtonPress) :
                x.addEventListener("touchend", insertNumButtonPress);
    });

    let funcKeys = document.querySelector("#func-keys");
    Array.from(funcKeys.childNodes).forEach(x => {
                (!isMobile) ? x.addEventListener("click", insertFuncButtonPress) :
                x.addEventListener("touchend", insertFuncButtonPress);
    });
}