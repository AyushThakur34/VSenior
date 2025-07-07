const BadWordsFilter = require("bad-words");

const checkBody = (body: string)=> {
    if(body.length < 3) { // spam check
        return "Content Too Short";
    }

    const filter = new BadWordsFilter(); // check for inappropraite language
    if (filter.isProfane(body)) {
        return "Inappropriate language is not allowed" 
    }

    return "valid";
}

export default checkBody;