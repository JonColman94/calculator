let funcMap = new Map([
    ["+", { precedence: 2, func: (a,b) => {return parseFloat(a) + parseFloat(b);}}],
    ["-", { precedence: 2, func: (a,b) => {return parseFloat(a) - parseFloat(b);}}],
    ["*", { precedence: 3, func: (a,b) => {return parseFloat(a) * parseFloat(b);}}],
    ["/", { precedence: 3, func: (a,b) => {return (parseFloat(b) == 0) ? "DIV0 ERROR" : parseFloat(a) / parseFloat(b);}}],
    ["^", { precedence: 4, func: (a,b) => {return parseFloat(a) ** parseFloat(b);}}],
    ["(", { precedence: -1}],
    ["(", { precedence: -1}]
]);

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
            if (isNaN(res)) return res;
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