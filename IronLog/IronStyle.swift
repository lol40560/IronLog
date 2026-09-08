import SwiftUI

enum IronStyle {
    static let ink = Color(red: 0.094, green: 0.082, blue: 0.075)
    static let paper = Color(red: 0.961, green: 0.922, blue: 0.867)
    static let paperShadow = Color(red: 0.875, green: 0.824, blue: 0.741)
    static let vermilion = Color(red: 0.722, green: 0.196, blue: 0.153)
    static let flame = Color(red: 0.894, green: 0.361, blue: 0.278)
    static let seal = Color(red: 0.435, green: 0.114, blue: 0.106)
    static let graphite = Color(red: 0.255, green: 0.239, blue: 0.216)
    static let quietInk = Color(red: 0.390, green: 0.365, blue: 0.333)
    static let line = Color(red: 0.662, green: 0.612, blue: 0.545)
    static let redGradient = LinearGradient(colors: [vermilion, flame], startPoint: .topLeading, endPoint: .bottomTrailing)
    static let paperGradient = LinearGradient(colors: [paper, Color(red: 0.93, green: 0.88, blue: 0.80)], startPoint: .top, endPoint: .bottom)
}

struct PaperPanel<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        content
            .padding(18)
            .background(IronStyle.paperGradient, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(IronStyle.line.opacity(0.55), lineWidth: 1))
            .shadow(color: .black.opacity(0.20), radius: 2, x: 0, y: 2)
            .foregroundStyle(IronStyle.graphite)
    }
}

struct SectionRule: View {
    var body: some View { Rectangle().fill(IronStyle.line.opacity(0.55)).frame(height: 1) }
}

struct Stamp: View {
    let text: String
    var prominent = false
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .black, design: .monospaced))
            .tracking(1)
            .padding(.horizontal, 9).padding(.vertical, 6)
            .foregroundStyle(prominent ? IronStyle.paper : IronStyle.vermilion)
            .background(prominent ? AnyShapeStyle(IronStyle.redGradient) : AnyShapeStyle(.clear), in: RoundedRectangle(cornerRadius: 4))
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(prominent ? .clear : IronStyle.vermilion, lineWidth: 1.5))
    }
}

struct InkMetric: View {
    let label: String; let value: String; let unit: String; let icon: String
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(label, systemImage: icon).font(.system(size: 11, weight: .semibold)).foregroundStyle(IronStyle.quietInk)
            HStack(alignment: .lastTextBaseline, spacing: 4) { Text(value).font(.system(size: 30, weight: .bold, design: .serif)).monospacedDigit(); Text(unit).font(.caption).foregroundStyle(IronStyle.quietInk) }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension View {
    func inkPage() -> some View { background(IronStyle.ink.ignoresSafeArea()).toolbarBackground(IronStyle.ink, for: .navigationBar) }
}
