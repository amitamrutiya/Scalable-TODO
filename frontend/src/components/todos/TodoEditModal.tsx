import { useState, useEffect, FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Todo, UpdateTodoData } from '@/types';

interface TodoEditModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateTodoData) => Promise<void>;
  isLoading?: boolean;
}

export function TodoEditModal({ todo, isOpen, onClose, onSubmit, isLoading }: TodoEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Pre-fill form when todo changes
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setDueDate(
        todo.due_date
          ? new Date(todo.due_date).toISOString().split('T')[0]
          : ''
      );
      setTagsInput(todo.tags.join(', '));
    }
  }, [todo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit(todo.id, {
      title,
      description: description || undefined,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      tags: tags.length > 0 ? tags : [],
    });

    onClose();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !todo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Edit Task</CardTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
              <TextArea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={2}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <Input
                label="Tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="work, urgent, personal"
              />
              <div className="flex gap-2">
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
