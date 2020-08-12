let funcMap = new Map([
    ["+", { precedence: 2, func: (a,b) => {return parseFloat(a) + parseFloat(b);}}],
    ["-", { precedence: 2, func: (a,b) => {return parseFloat(a) - parseFloat(b);}}],
    ["*", { precedence: 3, func: (a,b) => {return parseFloat(a) * parseFloat(b);}}],
    ["/", { precedence: 3, func: (a,b) => {return (parseFloat(b) == 0) ? "DIV0 ERROR" : parseFloat(a) / parseFloat(b);}}],
    ["^", { precedence: 4, func: (a,b) => {return parseFloat(a) ** parseFloat(b);}}],
    ["(", { precedence: -1}],
    [")", { precedence: -1}]
]);

let HistoryQueue = function(equationContext) {
    this.div = document.querySelector("#history-list-div");
    this.queue = [];
    this.equation_queue = [];
    this.value_queue = [];
    this.queue_max_length = 8;
    this.equationContext = equationContext;
    this.count = 0;

    this.push = function(eq, value) {
        if (value.match(/ERROR/)) return;
        let isMobile = window.matchMedia("only screen and (max-width: 760px").matches;
        let string_length_limit = isMobile ? 6 : 20;
        if (this.queue.length == this.queue_max_length) {
            old_history = this.queue.shift();
            this.div.removeChild(old_history);
            this.equation_queue.shift();
            this.value_queue.shift();
            old_history.childNodes[0].removeEventListener("click", setHistoricEquation);
            old_history.childNodes[0].removeEventListener("touchend", setHistoricEquation);
            old_history.childNodes[2].removeEventListener("click", setHistoricValue);
            old_history.childNodes[2].removeEventListener("touchend", setHistoricValue);
        }

        new_history = document.createElement("div");
        new_history.classList.add("history-div");        
        this.div.appendChild(new_history);

        new_history_eq = document.createElement("span");
        new_history_eq.classList.add("history-eq");
        new_history_eq.id = `eq${this.count}`
        new_history_eq.innerText = 
            (eq.length > string_length_limit ? eq.substring(0,string_length_limit) + "..." : eq);

        (!isMobile) ? 
            new_history_eq.addEventListener("click", setHistoricEquation) :
            new_history_eq.addEventListener("touchend", setHistoricEquation);

        new_history_value = document.createElement("span");
        new_history_value.classList.add("history-value");
        new_history_value.id = `vl${this.count}`
        new_history_value.innerText = 
            (value.length > string_length_limit ? value.substring(0,string_length_limit) + "..." : value);;

        (!isMobile) ?
            new_history_value.addEventListener("click", setHistoricValue) :
            new_history_value.addEventListener("touchend", setHistoricValue);

        new_history_equals = document.createElement("span");
        new_history_equals.classList.add("history-equals");
        new_history_equals.innerText = "="

        new_history.appendChild(new_history_eq);
        new_history.appendChild(new_history_equals);
        new_history.appendChild(new_history_value);
        
        this.queue.push(new_history);
        this.equation_queue.push([this.count, eq]);
        this.value_queue.push([this.count, value]);

        this.count++;
    }

    this.getString = function(id) {
        if (id.substring(0,2) == "eq") {
            for ([n, eq] of this.equation_queue) {
                if (n == id.substring(2)) return eq;
            }
        }
        else if (id.substring(0,2) == "vl") {
            for ([n, val] of this.value_queue) {
                if (n == id.substring(2)) return val;
            }
        }
    }
}

let EquationContext = function() {
    this.textbox = document.querySelector("#equation");
    this.parentheses_count = 0;
    this.history = new HistoryQueue(this);
    this.evaluated = false;

    this.undo = function() {
        let text = this.textbox.value;
        let end = text.charAt(text.length-1);
        text = text.substring(0, text.length-1);
        this.textbox.value = text;
        this.parentheses_count += (end == "(") ? -1 : ((end == ")") ? 1 : 0);
        this.evaluated = false;
    }

    this.reset = function() {
        this.parentheses_count = 0;
        this.textbox.value = "";
        this.evaluated = false;
    }

    this.push = function(char) {
        let text = this.textbox.value;
        let valuePlaced = false;
        if (text.match(/ERROR/)) text = "";
        switch (char) {
            case ".":
                if (text.match(/^.*[\+\/\*\-\^\(]$/) || text.length == 0 || this.evaluated) { //If string ends in operator or open parenthesis, 0.x
                    text += "0.";
                    valuePlaced = true;
                    break;
                }
                else if (text.match(/^((.*)([\+\/\*\-\^\(]))?(\d+)$/)) {    //If placing a decimal place
                    text += char;
                    valuePlaced = true;
                    break;
                }
                break;
            case "(":
                if (text.match(/^(.*)((\d)|\))+$/)) {                       //If string ends in a digit or closing parenthesis, multiply
                    text += "*("
                    this.parentheses_count++;
                    valuePlaced = true;
                    break;
                }
                else if (text.match(/^.*[^\.]$/) || text.length == 0) {     //If string does not end in a decimal place
                    text += char
                    this.parentheses_count++;
                    valuePlaced = true;
                    break;
                }
                break;
            case ")":
                if (this.parentheses_count > 0) {
                    if (text.match(/^.*[^\.\+\/\*\-\^\(]$/)) {               //If string does not end in operator or open parenthesis
                        text += char
                        this.parentheses_count--;
                        valuePlaced = true;
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
                        valuePlaced = true;
                        break;
                    }
                } else {
                    if (text.match(/^.*[^\)]$/) || text.length == 0) {
                        text = (this.evaluated) ? char : (text + char);
                        valuePlaced = true;
                        break;
                    }
                }
        }
        this.textbox.value = text;
        this.evaluated = false;
        return valuePlaced;
    }

    this.evaluate = function() {
        if (this.parentheses_count > 0) return;
        this.parentheses_count == 0
        let eq = this.textbox.value;
        if (eq.match(/[(NaN)(ERROR)]/)) return;
        let value = evaluateInfix(eq);
        this.history.push(eq, value);
        this.textbox.value = value;
        this.evaluated = true;
    }

    this.setFromValue = function(value) {
        this.parentheses_count = 0;
        this.evaluated = true;
        this.textbox.value = value;
    }

    this.setFromEquation = function(eq) {
        this.evaluated = false;
        this.parentheses_count = 0
        this.textbox.value = eq;
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
    if (isNaN(stack[0])) return stack[0];
    return parseFloat(stack[0]).toFixed(3);
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
        if(ec.push("^")) ec.push("2");
    }
    else if (this.id == "undo") ec.undo();
    else if (this.id == "clear") ec.reset();
    else if (this.id == "equals") ec.evaluate();

}

function setHistoricEquation() {
    ec.setFromEquation(ec.history.getString(this.id));
}

function setHistoricValue() {
    ec.setFromValue(ec.history.getString(this.id));
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