import { Filter } from "bad-words";

const checkBody = (body: string): string => {
    if (body.length < 3) {
        return "Content Too Short";
    }

    const filter = new Filter();
    if (filter.isProfane(body)) {
        return "Inappropriate language is not allowed";
    }

    return "valid";
};

export default checkBody;
