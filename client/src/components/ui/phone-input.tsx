import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber } from "@/lib/utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder = "Phone number", className }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanedValue = inputValue.replace(/\D/g, "");
    
    // Update display with formatting
    setDisplayValue(formatPhoneNumber(cleanedValue));
    
    // Pass cleaned value to parent
    onChange?.(cleanedValue);
  };

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}