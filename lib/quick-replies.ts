export interface QuickReplyVariableContext {
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
    agentName?: string | null;
}

export const AVAILABLE_QUICK_REPLY_VARIABLES = [
    { key: "{{first_name}}", label: "First Name", sample: "John" },
    { key: "{{last_name}}", label: "Last Name", sample: "Doe" },
    { key: "{{name}}", label: "Full Name", sample: "John Doe" },
    { key: "{{phone}}", label: "Phone", sample: "+1234567890" },
    { key: "{{email}}", label: "Email", sample: "john@example.com" },
    { key: "{{company}}", label: "Company", sample: "Acme Corp" },
    { key: "{{agent_name}}", label: "Agent Name", sample: "Alex" },
] as const;

/**
 * Replace variable placeholders like {{first_name}}, {{name}}, {{phone}}, etc.
 * with active conversation / customer attributes.
 */
export function interpolateQuickReply(
    template: string,
    context?: QuickReplyVariableContext
): string {
    if (!template) return "";
    if (!context) return template;

    const rawName = (context.contactName || "").trim();
    const nameParts = rawName ? rawName.split(/\s+/) : [];
    const firstName = nameParts.length > 0 ? nameParts[0] : "there";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const fullName = rawName || "there";
    const phone = context.phone || "";
    const email = context.email || "";
    const company = context.company || "";
    const agentName = context.agentName || "our team";

    return template
        .replace(/{{\s*first_name\s*}}/gi, firstName)
        .replace(/{{\s*last_name\s*}}/gi, lastName || firstName)
        .replace(/{{\s*(name|full_name)\s*}}/gi, fullName)
        .replace(/{{\s*phone\s*}}/gi, phone)
        .replace(/{{\s*email\s*}}/gi, email)
        .replace(/{{\s*company\s*}}/gi, company)
        .replace(/{{\s*agent_name\s*}}/gi, agentName);
}
