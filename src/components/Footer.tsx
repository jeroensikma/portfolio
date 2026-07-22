export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="w-full bg-white px-xl py-lg">
            <p className="text-black uppercase whitespace-nowrap">
                Copyright, {year}
            </p>
        </footer>
    );
}
