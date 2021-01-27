export const getRepoUri = (repo: string) => {
    const protocol = location.protocol;
    const host = location.host;
    const repoHref = `${protocol}//${host}/${repo}.git`;
    return repoHref
}