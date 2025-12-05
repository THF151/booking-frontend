declare module 'mjml-browser' {
    export default function mjml2html(
        mjml: string,
        options?: {
            validationLevel?: 'soft' | 'strict' | 'skip';
            minify?: boolean;
        }
    ): {
        html: string;
        errors: Array<{
            line: number;
            message: string;
            tagName: string;
            formattedMessage: string;
        }>;
    };
}