
/**
 * An IIFE (Immediately Invoked Function Expression) is a type of function designed to execute immediately
 * An example would include - to check user's login status, profile config, etc
 */


// Here is an example of an IIFE - it is wrapped in a function expression (i.e ()(); ) so JS passes the function in the first parenthesis as a param and executes it

(
  function greetUser(user = "Theo") {
    console.log(`Hello, ${user}`);
  }
)();
