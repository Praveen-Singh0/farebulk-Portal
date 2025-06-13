import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, StickyNote, CheckCircle2, Circle } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

interface TodoComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onTodoCountChange?: (count: number) => void;
  userId?: string; // For user-specific todos
}

const TodoComponent: React.FC<TodoComponentProps> = ({ 
  isOpen, 
  onClose, 
  onTodoCountChange,
  userId = 'default'
}) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Get storage key based on user
  const getStorageKey = (): string => `todos_${userId}`;

  // Load todos from localStorage on component mount
  useEffect(() => {
    try {
      const storedTodos = localStorage.getItem(getStorageKey());
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos);
        setTodos(parsedTodos);
        updateTodoCount(parsedTodos);
      }
    } catch (error) {
      console.error('Failed to load todos from localStorage:', error);
    }
  }, [userId]);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(todos));
    } catch (error) {
      console.error('Failed to save todos to localStorage:', error);
    }
  }, [todos, userId]);

  // Update todo count whenever todos change
  const updateTodoCount = useCallback((todoList: Todo[]) => {
    const activeCount = todoList.filter(todo => !todo.completed).length;
    onTodoCountChange?.(activeCount);
  }, [onTodoCountChange]);

  const addTodo = (): void => {
    if (newTodo.trim() !== '') {
      const todo: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        priority: newTodoPriority
      };
      
      const updatedTodos = [...todos, todo];
      setTodos(updatedTodos);
      updateTodoCount(updatedTodos);
      setNewTodo('');
      setNewTodoPriority('medium');
    }
  };

  const deleteTodo = (id: string): void => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    updateTodoCount(updatedTodos);
  };

  const toggleTodo = (id: string): void => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    updateTodoCount(updatedTodos);
  };

  const clearCompleted = (): void => {
    const updatedTodos = todos.filter(todo => !todo.completed);
    setTodos(updatedTodos);
    updateTodoCount(updatedTodos);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityDot = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active': return !todo.completed;
      case 'completed': return todo.completed;
      default: return true;
    }
  });

  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.filter(todo => todo.completed).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-200  overlay-fade"
        onClick={onClose}
      />

      {/* Todo Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] max-h-[90vh] z-50 todo-popup">
        <div className="bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden transition-all duration-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Todos</h3>
                  <p className="text-blue-100 text-sm">
                    {activeCount} active • {completedCount} completed
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Add Todo Section */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What needs to be done?"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Priority:</span>
                <select
                  value={newTodoPriority}
                  onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {[
              { key: 'all', label: 'All', count: todos.length },
              { key: 'active', label: 'Active', count: activeCount },
              { key: 'completed', label: 'Completed', count: completedCount }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  filter === key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Todos List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredTodos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <StickyNote className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-800">
                  {filter === 'all' ? 'No tasks yet' : 
                   filter === 'active' ? 'No active tasks' : 'No completed tasks'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {filter === 'all' ? 'Create your first task above' : 
                   filter === 'active' ? 'All tasks are completed!' : 'Complete some tasks to see them here'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(todo.priority)} ${
                      todo.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="flex-shrink-0 transition-colors"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getPriorityDot(todo.priority)}`} />
                        <span className="text-xs text-gray-500 uppercase font-medium">
                          {todo.priority}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        todo.completed 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-800'
                      }`}>
                        {todo.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(todo.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {todos.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{activeCount}</span> of{' '}
                  <span className="font-medium">{todos.length}</span> tasks remaining
                </div>
                {completedCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Clear completed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TodoComponent;