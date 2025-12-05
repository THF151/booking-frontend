'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import grapesjsMjml from 'grapesjs-mjml';

interface VisualEditorProps {
    mjmlContent: string;
    onMjmlChange: (mjml: string) => void;
}

const MINIMAL_VALID_MJML = `<mjml><mj-body></mj-body></mjml>`;
const VOID_MJML_TAGS = ['mj-spacer', 'mj-divider', 'mj-image'];

const extractHead = (mjml: string): string => {
    const m = mjml.match(/<mj-head[^>]*>([\s\S]*?)<\/mj-head>/i);
    return m ? m[0] : '';
};

const extractBodyInner = (mjml: string): string => {
    const m = mjml.match(/<mj-body[^>]*>([\s\S]*?)<\/mj-body>/i);
    return m ? m[1] : '';
};

const rebuildWithInitialHead = (bodyInner: string, initialHead: string): string => {
    const headPart = initialHead || '';
    return `<mjml>${headPart}<mj-body>${bodyInner || ''}</mj-body></mjml>`;
};

const cleanupMjml = (mjmlString: string, initialHead: string): string => {
    let cleaned = mjmlString;

    cleaned = cleaned.replace(/<mj-spacer([^>]*)>/gi, '<mj-spacer$1 />');
    cleaned = cleaned.replace(/<mj-divider([^>]*)>/gi, '<mj-divider$1 />');
    cleaned = cleaned.replace(/<mj-image([^>]*)>/gi, '<mj-image$1 />');

    cleaned = cleaned.replace(/<\/mj-spacer>/gi, '');
    cleaned = cleaned.replace(/<\/mj-divider>/gi, '');
    cleaned = cleaned.replace(/<\/mj-image>/gi, '');

    for (const tag of VOID_MJML_TAGS) {
        const regex = new RegExp(`<${tag}([^>]*)>\\s*<\\/${tag}>`, 'gi');
        cleaned = cleaned.replace(regex, `<${tag}$1 />`);
    }

    cleaned = cleaned.replace(/<mj-head[^>]*>[\s\S]*?<\/mj-head>/gi, '');

    const bodyInner = extractBodyInner(cleaned);
    return rebuildWithInitialHead(bodyInner, initialHead);
};

const getEditorMjml = (editor: Editor): string => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cmd = (editor as any).Commands?.get?.('mjml-get-code');
        if (cmd) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (editor as any).runCommand('mjml-get-code');
            if (result && typeof result.mjml === 'string') {
                return result.mjml;
            }
        }
    } catch {
        // ignore
    }
    return editor.getHtml();
};

export default function VisualEditor({ mjmlContent, onMjmlChange }: VisualEditorProps) {
    const editorRef = useRef<Editor | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const onMjmlChangeRef = useRef(onMjmlChange);
    const [mjmlError, setMjmlError] = useState<string | null>(null);

    const initialHeadRef = useRef<string>('');

    useEffect(() => {
        onMjmlChangeRef.current = onMjmlChange;
    }, [onMjmlChange]);

    useEffect(() => {
        if (!editorContainerRef.current || editorRef.current) return;

        const trimmed = (mjmlContent || '').trim();
        initialHeadRef.current = extractHead(trimmed);

        const initialMjml = trimmed ? mjmlContent : MINIMAL_VALID_MJML;

        const editor = grapesjs.init({
            container: editorContainerRef.current,
            fromElement: false,
            height: '100%',
            width: 'auto',
            storageManager: false,
            plugins: [grapesjsMjml],
            pluginsOpts: { 'grapesjs-mjml': { sourceEdit: false } },
            assetManager: { assets: [], noAssets: 'No images available', upload: false },
            components: initialMjml,
        });

        let updateTimeout: ReturnType<typeof setTimeout>;
        editor.on('update', () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(async () => {
                if (!editorRef.current) return;

                const raw = getEditorMjml(editorRef.current);
                const dirtyMjml = raw?.trim();

                if (!dirtyMjml || !/^<\s*mjml[\s>]/i.test(dirtyMjml)) {
                    return;
                }

                const cleanedMjml = cleanupMjml(dirtyMjml, initialHeadRef.current);

                try {
                    const mjmlCompiler = (await import('mjml-browser')).default;
                    const { errors } = mjmlCompiler(cleanedMjml, { validationLevel: 'strict' });

                    if (errors.length === 0) {
                        setMjmlError(null);
                        if (cleanedMjml !== mjmlContent) {
                            onMjmlChangeRef.current(cleanedMjml);
                        }
                    } else {
                        const errorMsg = `Visual editor produced invalid MJML: ${errors[0].formattedMessage}`;
                        console.error(errorMsg, errors);
                        setMjmlError(errorMsg);
                    }
                } catch (e) {
                    const errorMsg = 'An unexpected error occurred during MJML validation.';
                    console.error(errorMsg, e);
                    setMjmlError(errorMsg);
                }
            }, 300);
        });

        editorRef.current = editor;

        return () => {
            clearTimeout(updateTimeout);
            editor.destroy();
            editorRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const editorMjml = getEditorMjml(editor)?.trim();
        if (/^<\s*mjml[\s>]/i.test(editorMjml || '') && mjmlContent.trim() !== (editorMjml || '')) {
            initialHeadRef.current = extractHead((mjmlContent || '').trim());
            const contentToSet = (mjmlContent || '').trim() ? mjmlContent : MINIMAL_VALID_MJML;
            editor.setComponents(contentToSet);
            setMjmlError(null);
        }
    }, [mjmlContent]);

    return (
        <Paper variant="outlined" sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {mjmlError && (
                <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }} onClose={() => setMjmlError(null)}>
                    <Typography variant="caption">
                        <strong>Action Blocked:</strong> Invalid structure created. The editor attempted to nest an element incorrectly. Please try a different action.
                    </Typography>
                </Alert>
            )}
            <Box
                ref={editorContainerRef}
                sx={{
                    flexGrow: 1,
                    minHeight: 0,
                    '.gjs-cv-canvas': { top: 0, width: '100%', height: '100%' },
                }}
            />
        </Paper>
    );
}