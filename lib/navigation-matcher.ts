/**
 * Navigation route-matching utility for Connectly360
 * Ensures STRICTLY AT MOST ONE LEAF MENU ITEM IS ACTIVE AT ANY TIME.
 */

export interface LeafNavigationItem {
    id: string;
    label: string;
    href: string;
    exact?: boolean;
    patterns?: string[];
    permission?: string;
    icon?: any;
    badgeKey?: string;
}

export interface GroupNavigationItem {
    id: string;
    label: string;
    href?: string;
    icon?: any;
    permission?: string;
    subItems: LeafNavigationItem[];
}

export type AnyNavigationItem = LeafNavigationItem | GroupNavigationItem;

export interface NavigationSection {
    section: string;
    items: AnyNavigationItem[];
}

/**
 * Normalizes URL path by stripping query params, hashes, and trailing slashes.
 */
export function normalizePathname(pathname: string): string {
    if (!pathname) return "/";
    let clean = pathname.split("?")[0].split("#")[0].trim();
    if (clean.length > 1 && clean.endsWith("/")) {
        clean = clean.slice(0, -1);
    }
    return clean || "/";
}

/**
 * Check if a path matches a wildcard pattern like `/contacts/**` or `/users/:id`
 */
function matchesPattern(path: string, pattern: string): boolean {
    const cleanPattern = normalizePathname(pattern);
    if (cleanPattern.endsWith("/**")) {
        const prefix = cleanPattern.slice(0, -3);
        return path === prefix || path.startsWith(prefix + "/");
    }
    if (cleanPattern.endsWith("/*")) {
        const prefix = cleanPattern.slice(0, -2);
        return path === prefix || path.startsWith(prefix + "/");
    }
    // Simple param replacement e.g. /contacts/:id
    const regexPattern = cleanPattern
        .replace(/:[a-zA-Z0-9_]+/g, "[^/]+")
        .replace(/\*\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
}

export interface ActiveMatchResult {
    activeLeafId: string | null;
    activeLeafHref: string | null;
    expandedGroupId: string | null;
}

/**
 * Resolves the EXACT single active leaf navigation item across all navigation sections.
 * Guarantees that at most 1 leaf item is active.
 */
export function resolveActiveNavigation(
    currentPath: string,
    sections: NavigationSection[]
): ActiveMatchResult {
    const normalized = normalizePathname(currentPath);

    // Extract all leaf items with parent reference
    const leafItemsWithGroup: { leaf: LeafNavigationItem; group: GroupNavigationItem | null }[] = [];

    for (const section of sections) {
        for (const item of section.items) {
            if ("subItems" in item && Array.isArray(item.subItems) && item.subItems.length > 0) {
                for (const sub of item.subItems) {
                    leafItemsWithGroup.push({ leaf: sub, group: item });
                }
            } else {
                leafItemsWithGroup.push({ leaf: item as LeafNavigationItem, group: null });
            }
        }
    }

    let bestScore = 0;
    let bestMatch: { leaf: LeafNavigationItem; group: GroupNavigationItem | null } | null = null;

    for (const entry of leafItemsWithGroup) {
        const { leaf } = entry;
        const leafHref = normalizePathname(leaf.href);
        let score = 0;

        // 1. Exact match (Highest Priority)
        if (normalized === leafHref) {
            score = 2000 + leafHref.length;
        } 
        // 2. Explicit patterns match
        else if (leaf.patterns && leaf.patterns.some((pat) => matchesPattern(normalized, pat))) {
            score = 1500 + leafHref.length;
        }
        // 3. Child/Detail path match (only if NOT marked exact)
        else if (!leaf.exact && leafHref !== "/" && normalized.startsWith(leafHref + "/")) {
            // Give higher score to longer/more specific parent routes
            score = 1000 + leafHref.length;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    if (!bestMatch) {
        return {
            activeLeafId: null,
            activeLeafHref: null,
            expandedGroupId: null,
        };
    }

    return {
        activeLeafId: bestMatch.leaf.id || bestMatch.leaf.href,
        activeLeafHref: bestMatch.leaf.href,
        expandedGroupId: bestMatch.group ? bestMatch.group.id || bestMatch.group.label : null,
    };
}
