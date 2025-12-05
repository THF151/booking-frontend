'use client';

import React, { useEffect, useState } from 'react';
import { Box, IconButton, MenuItem, Select, useColorScheme, SelectChangeEvent } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Header({ lang }: { lang: string }) {
    const { mode, setMode } = useColorScheme();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const handleLangChange = (event: SelectChangeEvent) => {
        const newLang = event.target.value;
        const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
        const paramsString = searchParams.toString();
        const finalUrl = paramsString ? `${newPath}?${paramsString}` : newPath;
        router.push(finalUrl);
    };

    return (
        <Box sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 2,
            zIndex: 50
        }}>
            <Select
                value={lang}
                onChange={handleLangChange}
                size="small"
                variant="outlined"
                sx={{
                    bgcolor: 'background.paper',
                    height: 40,
                    borderRadius: 2,
                    boxShadow: 1
                }}
            >
                <MenuItem value="en">🇺🇸 EN</MenuItem>
                <MenuItem value="de">🇩🇪 DE</MenuItem>
            </Select>

            <IconButton
                onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    width: 40,
                    height: 40,
                    borderRadius: 2
                }}
            >
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
        </Box>
    );
}