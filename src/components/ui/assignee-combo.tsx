import React, { useState } from 'react';
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, User } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface AssigneeComboProps {
  users: User[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function AssigneeCombo({ 
  users, 
  value, 
  onChange, 
  placeholder = "Assign to someone...",
  className = ""
}: AssigneeComboProps) {
  const [open, setOpen] = useState(false);
  const selectedUser = users.find(u => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            {selectedUser ? (
              <>
                {selectedUser.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
                <span>{selectedUser.name}</span>
                {selectedUser.role && (
                  <span className="text-xs text-gray-500">({selectedUser.role})</span>
                )}
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[300px] z-[1000002]" 
        align="start" 
        side="bottom"
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder="Search user..." />
          <CommandList>
            {users.map(user => (
              <CommandItem 
                key={user.id} 
                onSelect={() => {
                  onChange(user.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  {user.role && (
                    <div className="text-xs text-gray-500">{user.role}</div>
                  )}
                </div>
                {value === user.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
