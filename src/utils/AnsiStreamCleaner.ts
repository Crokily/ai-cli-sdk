export class AnsiStreamCleaner {
  private carry = "";

  reset(): void {
    this.carry = "";
  }

  strip(chunk: string): string {
    if (!chunk) return "";
    const input = this.carry + chunk;
    this.carry = "";

    let output = "";
    let i = 0;
    while (i < input.length) {
      const current = input[i];
      if (current !== "\u001b") {
        output += current;
        i += 1;
        continue;
      }

      const start = i;
      i += 1;
      if (i >= input.length) {
        this.carry = input.slice(start);
        break;
      }

      const next = input[i];
      if (next === "[") {
        i += 1;
        let complete = false;
        while (i < input.length) {
          const code = input.charCodeAt(i);
          if (code >= 0x40 && code <= 0x7e) {
            i += 1;
            complete = true;
            break;
          }
          i += 1;
        }
        if (!complete) {
          this.carry = input.slice(start);
          break;
        }
        continue;
      }

      if (next === "]" || next === "P" || next === "^" || next === "_") {
        i += 1;
        let complete = false;
        while (i < input.length) {
          const value = input[i];
          if (value === "\u0007") {
            i += 1;
            complete = true;
            break;
          }
          if (value === "\u001b" && input[i + 1] === "\\") {
            i += 2;
            complete = true;
            break;
          }
          i += 1;
        }
        if (!complete) {
          this.carry = input.slice(start);
          break;
        }
        continue;
      }

      const nextCode = input.charCodeAt(i);
      if (nextCode >= 0x20 && nextCode <= 0x2f) {
        i += 1;
        if (i >= input.length) {
          this.carry = input.slice(start);
          break;
        }
        i += 1;
        continue;
      }

      i += 1;
    }

    return output;
  }
}
