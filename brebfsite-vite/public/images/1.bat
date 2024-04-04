@echo off
setlocal enabledelayedexpansion

set "count=1"

for %%F in (*) do (
    ren "%%F" "!count!%%~xF"
    set /a "count+=1"
)

endlocal