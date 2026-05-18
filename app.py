"""Mini calculator CLI — target app for the demo SDLC."""
import sys


def add(a: float, b: float) -> float:
    return a + b


def sub(a: float, b: float) -> float:
    return a - b


def mul(a: float, b: float) -> float:
    return a * b


def div(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("division by zero")
    return a / b


def mod(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("modulo by zero")
    return a % b


OPS = {"add": add, "sub": sub, "mul": mul, "div": div, "mod": mod}


def main(argv: list[str]) -> int:
    if len(argv) != 3 or argv[0] not in OPS:
        print(f"usage: python app.py <{'|'.join(OPS)}> <a> <b>", file=sys.stderr)
        return 1
    op, a, b = argv[0], float(argv[1]), float(argv[2])
    print(OPS[op](a, b))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
