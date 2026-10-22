import { getRouteApi } from "@tanstack/react-router";

const authApi = getRouteApi("/_authenticated");

/** Signed-in user, provided by the auth gate for every page under it. */
export const useAuthUser = () => authApi.useRouteContext().user;
