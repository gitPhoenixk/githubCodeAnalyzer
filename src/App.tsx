import './App.css'
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export interface FuncInfo {
    function_name: string;
    start_line: number;
    end_line: number;
    code: string;
    explanation: string;
}

interface FileContent {
    result: FuncInfo[] | string;
    full_content?: string;
}

const FileViewer: React.FC<{
    fullContent: string;
    functions: FuncInfo[];
    fileName: string;
}> = ({ fullContent, functions, fileName }) => {
    const [hoveredFunction, setHoveredFunction] = useState<FuncInfo | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const lines = fullContent.split('\n');

    const functionLineMap = new Map<number, FuncInfo>();
    functions.forEach(func => {
        for (let i = func.start_line; i <= func.end_line; i++) {
            functionLineMap.set(i, func);
        }
    });

    const handleLineHover = (lineNumber: number, event: React.MouseEvent, func: FuncInfo | undefined) => {
        if (func) {
            setHoveredFunction(func);
            setTooltipPosition({ x: event.clientX, y: event.clientY });
        } else {
            setHoveredFunction(null);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <h3>Файл: {fileName}</h3>

            {hoveredFunction && (
                <div style={{
                    position: 'fixed',
                    top: tooltipPosition.y + 20,
                    left: tooltipPosition.x + 20,
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '12px',
                    maxWidth: '400px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animation: 'slideDown 0.2s ease'
                }}>
                    <strong>🤖 Объяснение функции {hoveredFunction.function_name}:</strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                        {hoveredFunction.explanation}
                    </p>
                </div>
            )}

            {/* Отображение всего кода с подсветкой */}
            <div style={{
                borderRadius: '8px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.5'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                    {lines.map((line, index) => {
                        const lineNumber = index + 1;
                        const func = functionLineMap.get(lineNumber);
                        const isInFunction = !!func;

                        return (
                            <tr
                                key={lineNumber}
                                style={{
                                    backgroundColor: isInFunction ? '#222' : 'transparent',
                                    borderLeft: isInFunction ? '3px solid #ffc107' : 'none',
                                    cursor: isInFunction ? 'pointer' : 'default'
                                }}
                                onMouseEnter={(e) => handleLineHover(lineNumber, e, func)}
                                onMouseLeave={() => setHoveredFunction(null)}
                            >
                                <td style={{
                                    padding: '2px 8px',
                                    color: '#999',
                                    userSelect: 'none',
                                    width: '50px',
                                    textAlign: 'right',
                                    borderRight: '1px solid #ddd'
                                }}>
                                    {lineNumber}
                                </td>
                                <td style={{
                                    padding: '2px 8px',
                                    whiteSpace: 'pre',
                                    overflowX: 'auto'
                                }}>
                                    {line || ' '}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FileContent: React.FC<{func: FuncInfo}> = ({ func }) => {
    const [isHovered, setIsHovered] = useState(false);

    return(
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            margin: '16px 0',
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
        }}
             onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}>
            <div style={{
                padding: '12px 16px',
                borderRadius: '8px 8px 0 0',
                borderBottom: '1px solid #ddd',
                fontWeight: 'bold',
                cursor: 'pointer'
            }}>
                {func.function_name}
                <span style={{
                    fontSize: '12px',
                    color: '#666',
                    marginLeft: '12px'
                }}>
                    строки {func.start_line} - {func.end_line}
                </span>
            </div>
            <pre style={{
                padding: '16px',
                margin: 0,
                overflowX: 'auto',
                fontSize: '13px',
                fontFamily: 'monospace'
            }}>
                {func.code}
            </pre>
            {isHovered && (
                <div style={{
                    position: 'relative',
                    padding: '16px',
                    borderTop: '2px solid #2196f3',
                    borderRadius: '0 0 8px 8px',
                    animation: 'slideDown 0.2s ease'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '20px',
                        width: '0',
                        height: '0',
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '10px solid #2196f3'
                    }}/>
                    <strong>🤖 Объяснение кода:</strong>
                    <p style={{ margin: '8px 0 0 0', lineHeight: '1.5' }}>{func.explanation}</p>
                </div>
            )}
        </div>
    )
}

class RepoData {
    name: string;
    files: string[];
    constructor() {
        this.name = '';
        this.files = [];
    }
}

function App() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [loading, setLoading] = useState(false);
    const [fileLoading, setFileLoading] = useState(false);
    const [repodata, setRepoData] = useState<RepoData | null>(null);
    const [functions, setFunctions] = useState<FuncInfo[]>([]);
    const [fullFileContent, setFullFileContent] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [viewMode, setViewMode] = useState<'full' | 'functions'>('full'); // Переключатель режимов
    const navigate = useNavigate();

    const sendRequest = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/get_project?projectURL=' + encodeURIComponent(searchQuery));
            const data = await response.json();
            const resultdata = new RepoData();
            const keys = Object.keys(data);
            resultdata.name = keys[0];
            resultdata.files = data[resultdata.name];
            setRepoData(resultdata);
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileContents = async (fileName: string) => {
        if (!repodata) return;

        setFileLoading(true);
        setSelectedFile(fileName);
        setFunctions([]);
        setFullFileContent('');

        try {
            const response = await fetch(
                `http://localhost:8000/projects/get_contents_described?project=${encodeURIComponent(repodata.name)}&fileName=${encodeURIComponent(fileName)}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Сохраняем полное содержимое и функции
            setFullFileContent(data.full_content || '');

            if (Array.isArray(data.functions)) {
                setFunctions(data.functions);
            } else if (Array.isArray(data.result)) {
                setFunctions(data.result);
                if (!data.full_content && data.result.length > 0) {
                    const fullCode = data.result.map((f: FuncInfo) => f.code).join('\n\n');
                    setFullFileContent(fullCode);
                }
            } else {
                setFunctions([{
                    function_name: "Весь файл",
                    start_line: 1,
                    end_line: 999,
                    code: data.result as string || data.full_content || "Нет содержимого",
                    explanation: "Файл не удалось разбить на отдельные функции"
                }]);
                setFullFileContent(data.result as string || data.full_content || '');
            }
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            setFunctions([{
                function_name: "Ошибка",
                start_line: 0,
                end_line: 0,
                code: "",
                explanation: `Ошибка загрузки файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            }]);
        } finally {
            setFileLoading(false);
        }
    };

    const handleSearch = (): void => {
        if (!query.trim()) {
            searchParams.delete('q');
            navigate({ search: searchParams.toString() });
        } else {
            setSearchParams({ q: query });
            setRepoData(null);
            setSelectedFile('');
            setFunctions([]);
            setFullFileContent('');
            sendRequest(query);
        }
    };

    const handleEnter = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    return (
        <>
            <div id="main">
                <h1>MyProject</h1>
                <input
                    id="search"
                    type="text"
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQuery(e.target.value)
                    }
                    onKeyPress={handleEnter}
                    placeholder="Вставьте ссылку на GitHub проект..."
                    disabled={loading}
                />
                {loading && <p>Загрузка...</p>}
            </div>
            <div>
                {repodata && (
                    <div id="repo-data">
                        <div id="navbar">
                            <h3 id="name">{repodata.name}</h3>
                            <div style={{ marginBottom: '10px' }}>
                                <button
                                    onClick={() => setViewMode('full')}
                                    style={{
                                        padding: '5px 10px',
                                        marginRight: '5px',
                                        backgroundColor: viewMode === 'full' ? '#aa3bff' : '#ddd',
                                        color: viewMode === 'full' ? 'white' : 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Весь код
                                </button>
                                <button
                                    onClick={() => setViewMode('functions')}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: viewMode === 'functions' ? '#aa3bff' : '#ddd',
                                        color: viewMode === 'functions' ? 'white' : 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Только функции
                                </button>
                            </div>
                            {repodata.files.map((file) => (
                                <h3
                                    id="filetext"
                                    key={file}
                                    onClick={() => getFileContents(file)}
                                    style={{
                                        color: selectedFile === file ? "#aa3bff" : "#6b6375",
                                        cursor: 'pointer'
                                    }}
                                >
                                    {file.slice(0, -4)}
                                </h3>
                            ))}
                        </div>

                        <div id="code" style={{
                            flex: 1,
                            padding: '10px',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}>
                            {fileLoading && <p>Загрузка и анализ файла...</p>}

                            {!fileLoading && viewMode === 'full' && fullFileContent && (
                                <FileViewer
                                    fullContent={fullFileContent}
                                    functions={functions}
                                    fileName={selectedFile}
                                />
                            )}

                            {!fileLoading && viewMode === 'functions' && functions.length > 0 && (
                                <div>
                                    <h3>Функции в файле {selectedFile}:</h3>
                                    {functions.map((func, index) => (
                                        <FileContent key={index} func={func} />
                                    ))}
                                </div>
                            )}

                            {!fileLoading && functions.length === 0 && selectedFile && (
                                <p>Файл загружен, но функции не найдены</p>
                            )}
                            {!selectedFile && !fileLoading && (
                                <p>Выберите файл из списка слева</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default App;