'use client';
import { Paper } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { html as htmlLang } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import { useColorScheme } from '@mui/material/styles';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: 'mjml' | 'html';
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
    const { mode } = useColorScheme();

    return (
        <Paper
            elevation={0}
            sx={{
                border: 'none',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                '& .cm-editor': {
                    fontSize: '14px',
                    flexGrow: 1,
                }
            }}
        >
            <CodeMirror
                value={value}
                height="100%"
                width="100%"
                extensions={[htmlLang({ matchClosingTags: true, autoCloseTags: true }), EditorView.lineWrapping]}
                onChange={onChange}
                theme={mode === 'dark' ? tokyoNight : 'light'}
            />
        </Paper>
    );
}