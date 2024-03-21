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