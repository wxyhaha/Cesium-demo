export function calcFromTo(count, page, pageSize) {
    let from = 0;
    let to = 0
    if ((page - 1) * pageSize + 1 > count) {
        from = (Math.floor(count / pageSize) - 1) * pageSize + 1
        to = (Math.floor(count / pageSize) - 1) * pageSize + pageSize
    } else {
        from = (page - 1) * pageSize + 1
        to = (page - 1) * pageSize + pageSize
    }

    return {from, to}
}

export const guid = (): string => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    }

    return s4() + s4() + '-' + s4()
}