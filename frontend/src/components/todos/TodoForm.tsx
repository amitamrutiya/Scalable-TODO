import { useState, FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { CreateTodoData } from '@/types';

interface TodoFormProps {
  onSubmit: (data: CreateTodoData) => Promise<void>;
  isLoading?: boolean;
}

export function TodoForm({ onSubmit, isLoading }: TodoFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit({
      title,
      description: description || undefined,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTagsInput('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full" variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Add New Task
      </Button>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">New Task</CardTitle>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
