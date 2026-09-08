import SwiftUI
import SwiftData
import Charts
import UniformTypeIdentifiers
struct ContentView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.scenePhase) private var phase
    @Query(sort: \TrainingSession.started, order: .reverse) private var sessions: [TrainingSession]
    @Query private var routines: [TrainingRoutine]
    @AppStorage("gym") private var gym = "我的健身房"
    @AppStorage("pounds") private var pounds = false
    @State private var health = HealthSummary()
    @State private var active: TrainingSession?
    @State private var showCreator = false
    @State private var error: String?
    var finished: [TrainingSession] { sessions.filter { $0.ended != nil } }
    var draft: TrainingSession? { sessions.first { $0.ended == nil } }
    var body: some View {
        TabView {
            NavigationStack { today }.tabItem { Label("今日", systemImage: "square.grid.2x2.fill") }
            NavigationStack { routinePage }.tabItem { Label("訓練", systemImage: "dumbbell.fill") }
            NavigationStack { progressPage }.tabItem { Label("進度", systemImage: "chart.xyaxis.line") }
            NavigationStack { HealthPage(health: health) }.tabItem { Label("健康", systemImage: "heart.fill") }
            NavigationStack { SettingsPage(sessions: finished) }.tabItem { Label("設定", systemImage: "slider.horizontal.3") }
        }.tint(IronStyle.vermilion).preferredColorScheme(.dark)
        .fullScreenCover(item: $active) { session in NavigationStack { WorkoutPage(session: session) }.preferredColorScheme(.dark).tint(IronStyle.vermilion) }
        .sheet(isPresented: $showCreator) { NavigationStack { RoutineEditor() }.preferredColorScheme(.dark).tint(IronStyle.vermilion) }
        .alert("無法儲存", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) { Button("好") { error = nil } } message: { Text(error ?? "") }
        .task { migrateLegacyHistory(); if health.requested { await health.refresh() } }
        .onChange(of: phase) { _, value in if value == .active && health.requested { Task { await health.refresh() } } }
    }
    var today: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack { Text(Date.now.formatted(.dateTime.year().month().day().weekday())).font(.system(.caption, design: .monospaced).weight(.semibold)); Spacer(); Text("IRONLOG / TRAINING RECORD").font(.system(size: 10, weight: .bold, design: .monospaced)).tracking(1) }.foregroundStyle(IronStyle.paper.opacity(0.7))
                HStack(alignment: .top) { VStack(alignment: .leading, spacing: 6) { Text("今日訓練").font(.system(size: 35, weight: .bold, design: .serif)).foregroundStyle(IronStyle.paper); Text(draft == nil ? "尚未開始記錄" : "有一份未完成的訓練紀錄").font(.subheadline).foregroundStyle(IronStyle.paper.opacity(0.65)) }; Spacer(); Stamp(text: draft == nil ? "待開始" : "進行中", prominent: draft != nil) }
                VStack(alignment: .leading, spacing: 18) {
                    HStack { Stamp(text: draft == nil ? "訓練單" : "未完成"); Spacer(); Text(draft == nil ? "TODAY" : "RESUME").font(.system(.caption, design: .monospaced).weight(.bold)).foregroundStyle(IronStyle.quietInk) }
                    Text(draft?.title ?? "自由訓練").font(.system(.title2, design: .serif).weight(.bold))
                    Label(draft?.gym ?? gym, systemImage: "mappin.and.ellipse").font(.subheadline).foregroundStyle(IronStyle.quietInk)
                    SectionRule()
                    Button { if let draft { active = draft } else { start("自由訓練", exercises: []) } } label: {
                        HStack { Text(draft == nil ? "開始記錄" : "繼續記錄"); Spacer(); Image(systemName: "arrow.right") }.font(.headline).padding(14).foregroundStyle(IronStyle.paper).background(IronStyle.redGradient, in: RoundedRectangle(cornerRadius: 8))
                    }
                }.padding(20).background(IronStyle.paperGradient, in: RoundedRectangle(cornerRadius: 12)).overlay(RoundedRectangle(cornerRadius: 12).stroke(IronStyle.line.opacity(0.6)))
                HStack(spacing: 12) {
                    PaperPanel { InkMetric(label: "本週訓練", value: "\(finished.filter { Calendar.current.isDate($0.started, equalTo: .now, toGranularity: .weekOfYear) }.count)", unit: "次", icon: "dumbbell.fill") }
                    PaperPanel { InkMetric(label: "今日步數", value: health.steps.map { Int($0).formatted() } ?? "—", unit: "步", icon: "figure.walk") }
                }
                HStack { Text("本週記錄").font(.system(.title3, design: .serif).weight(.bold)).foregroundStyle(IronStyle.paper); Spacer(); Text("最近 7 天").font(.caption).foregroundStyle(IronStyle.paper.opacity(0.6)) }
                HStack(spacing: 0) {
                    ForEach((0..<7).reversed(), id: \.self) { offset in
                        let day = Calendar.current.date(byAdding: .day, value: -offset, to: .now)!
                        let trained = finished.contains { Calendar.current.isDate($0.started, inSameDayAs: day) }
                        VStack(spacing: 12) {
                            Text(day.formatted(.dateTime.weekday(.narrow))).font(.caption).foregroundStyle(IronStyle.paper.opacity(0.6))
                            Text(trained ? "●" : "—").font(.title3).frame(width: 28, height: 28).foregroundStyle(trained ? IronStyle.flame : IronStyle.paper.opacity(0.25))
                        }.frame(maxWidth: .infinity)
                    }
                }
                if let last = finished.first { Text("上次訓練").font(.system(.title3, design: .serif).weight(.bold)).foregroundStyle(IronStyle.paper); NavigationLink { SessionDetail(session: last) } label: { sessionRow(last) }.buttonStyle(.plain) }
                else { Text("完成第一份訓練單後，記錄將出現在這裡。") .font(.subheadline).foregroundStyle(IronStyle.paper.opacity(0.65)).padding(.vertical) }
            }.padding(22)
        }.inkPage().toolbar(.hidden, for: .navigationBar)
    }
    var routinePage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("課表是下一次訓練的起點。") .foregroundStyle(IronStyle.paper.opacity(0.65))
                if let draft { Button("繼續 \(draft.title)") { active = draft }.buttonStyle(.borderedProminent).tint(IronStyle.vermilion) }
                ForEach(routines) { routine in
                    VStack(alignment: .leading, spacing: 14) {
                        HStack { Text(routine.title).font(.title3.bold()); Spacer(); NavigationLink { RoutineEditor(existing: routine) } label: { Image(systemName: "square.and.pencil") }.accessibilityLabel("編輯課表") }
                        Text(routine.exercises.map(\.name).joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
                        Button { start(routine.title, exercises: routine.exercises) } label: { Label("開始訓練", systemImage: "play.fill").frame(maxWidth: .infinity) }.buttonStyle(.bordered)
                    }.paperPanel()
                }
                Text("入門課表").font(.system(.title3, design: .serif).weight(.bold)).foregroundStyle(IronStyle.paper)
                Text("重量由你設定。先熟悉動作，再逐步增加負重。").font(.caption).foregroundStyle(IronStyle.paper.opacity(0.65))
                starter("推 · 胸肩三頭", names: ["槓鈴臥推", "上斜啞鈴推舉", "滑輪側平舉", "繩索下壓"])
                starter("拉 · 背部二頭", names: ["滑輪下拉", "槓鈴划船", "反向飛鳥", "貝氏彎舉"])
                starter("腿 · 下肢訓練", names: ["槓鈴深蹲", "羅馬尼亞硬舉", "腿推", "站姿提踵"])
            }.padding(20)
        }.inkPage().navigationTitle("訓練課表").toolbar { Button { showCreator = true } label: { Image(systemName: "plus") }.accessibilityLabel("新增課表") }
    }
    func starter(_ title: String, names: [String]) -> some View {
        Button {
            context.insert(TrainingRoutine(title: title, exercises: names.compactMap { name in exerciseLibrary.first { $0.name == name }?.logged }))
            do { try context.save() } catch { self.error = error.localizedDescription }
        } label: { PaperPanel { HStack { VStack(alignment: .leading, spacing: 6) { Text(title).font(.headline); Text("\(names.count) 個動作 · 加入我的課表").font(.caption).foregroundStyle(IronStyle.quietInk) }; Spacer(); Image(systemName: "plus.circle").foregroundStyle(IronStyle.vermilion) } } }.buttonStyle(.plain)
    }
    var progressPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack { PaperPanel { InkMetric(label: "累積訓練", value: "\(finished.count)", unit: "次", icon: "flame") }; PaperPanel { InkMetric(label: "完成組數", value: "\(finished.reduce(0) { $0 + $1.completedSets })", unit: "組", icon: "checkmark.circle") } }
                if finished.isEmpty { ContentUnavailableView("你的進步，從這裡開始", systemImage: "chart.xyaxis.line", description: Text("完成一次訓練後，查看訓練量與完整紀錄。")) }
                else {
                    Text("每次訓練量").font(.system(.title3, design: .serif).weight(.bold)).foregroundStyle(IronStyle.paper)
                    Text("已完成正式組的重量 × 次數（\(pounds ? "lb" : "kg")）").font(.caption).foregroundStyle(IronStyle.paper.opacity(0.65))
                    PaperPanel { Chart(finished.prefix(12).reversed()) { session in BarMark(x: .value("日期", session.started), y: .value("訓練量", IronUnits.display(session.volume, pounds: pounds))).foregroundStyle(IronStyle.redGradient).cornerRadius(2) }.chartXAxis { AxisMarks { AxisValueLabel().foregroundStyle(IronStyle.quietInk) } }.chartYAxis { AxisMarks { AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)); AxisValueLabel().foregroundStyle(IronStyle.quietInk) } }.frame(height: 180) }
                    Text("訓練歷史").font(.system(.title3, design: .serif).weight(.bold)).foregroundStyle(IronStyle.paper)
                    ForEach(finished) { session in NavigationLink { SessionDetail(session: session) } label: { sessionRow(session) }.buttonStyle(.plain) }
                }
            }.padding(20)
        }.inkPage().navigationTitle("每一步進步")
    }
    func sessionRow(_ session: TrainingSession) -> some View {
        HStack {
            Text(session.started.formatted(.dateTime.day())).font(.system(size: 24, weight: .bold, design: .serif)).foregroundStyle(IronStyle.vermilion).frame(width: 32)
            VStack(alignment: .leading, spacing: 5) { Text(session.title).font(.headline); Text("\(session.started.formatted(date: .abbreviated, time: .omitted)) · \(session.completedSets) 組").font(.caption).foregroundStyle(IronStyle.quietInk) }
            Spacer(); Image(systemName: "arrow.right").font(.caption).foregroundStyle(IronStyle.quietInk)
        }.paperPanel()
    }
    func start(_ title: String, exercises: [LoggedExercise]) {
        if let draft { active = draft; return }
        let session = TrainingSession(title: title, gym: gym, exercises: exercises)
        context.insert(session)
        do { try context.save(); active = session } catch { context.delete(session); self.error = error.localizedDescription }
    }
    func migrateLegacyHistory() {
        guard !UserDefaults.standard.bool(forKey: "legacyHistoryImported") else { return }
        do {
            let legacy = try context.fetch(FetchDescriptor<Workout>())
            let imported = Set(try context.fetch(FetchDescriptor<TrainingSession>()).map(\.id))
            for old in legacy where !imported.contains(old.id) {
                let exercises = old.exercises.map { ex in
                    var result = LoggedExercise(name: ex.exerciseName, muscle: ex.primaryMuscle ?? "", equipment: "原有紀錄")
                    result.sets = ex.sets.map { set in LoggedSet(weight: set.weight ?? 0, reps: set.reps ?? 0, done: set.completed, warmup: set.type == .warmup) }
                    return result
                }
                let session = TrainingSession(title: "原有訓練紀錄", gym: "原有紀錄", exercises: exercises)
                session.id = old.id; session.started = old.date; session.ended = old.date
                context.insert(session)
            }
            try context.save()
            UserDefaults.standard.set(true, forKey: "legacyHistoryImported")
        } catch { self.error = "原有紀錄載入失敗：" + error.localizedDescription }
    }
}
struct MetricCard: View {
    let title: String; let value: String; let unit: String; let icon: String
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Label(title, systemImage: icon).font(.caption).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline, spacing: 4) { Text(value).font(.system(size: 28, weight: .bold, design: .rounded)).monospacedDigit(); Text(unit).font(.caption).foregroundStyle(.secondary) }
        }.frame(maxWidth: .infinity, alignment: .leading).paperPanel()
    }
}
extension View { func paperPanel() -> some View { PaperPanel { self } } }
struct SessionDetail: View {
    let session: TrainingSession
    @AppStorage("pounds") private var pounds = false
    var body: some View {
        List {
            Section { LabeledContent("日期", value: session.started.formatted()); LabeledContent("健身房", value: session.gym); LabeledContent("完成組數", value: "\(session.completedSets)") }
            ForEach(session.exercises) { ex in Section(ex.name) { ForEach(ex.sets) { set in HStack { Image(systemName: set.done ? "checkmark.seal.fill" : "circle").foregroundStyle(set.done ? IronStyle.vermilion : Color.gray); Text("\(IronUnits.display(set.weight, pounds: pounds), specifier: "%.1f") \(pounds ? "lb" : "kg") × \(set.reps)"); Spacer(); if set.warmup { Text("熱身").font(.caption) } } } } }
        }.navigationTitle(session.title)
    }
}
struct CSVDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.commaSeparatedText] }
    var text: String
    init(text: String) { self.text = text }
    init(configuration: ReadConfiguration) throws { text = String(decoding: configuration.file.regularFileContents ?? Data(), as: UTF8.self) }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: Data(text.utf8)) }
}
struct SettingsPage: View {
    let sessions: [TrainingSession]
    @AppStorage("gym") private var gym = "我的健身房"
    @AppStorage("pounds") private var pounds = false
    @AppStorage("trainingSounds") private var trainingSounds = true
    @Query private var memories: [EquipmentMemory]
    @State private var exporting = false
    @State private var exportError: String?
    var body: some View {
        Form {
            Section("訓練偏好") { TextField("健身房名稱", text: $gym); Picker("重量單位", selection: $pounds) { Text("公斤 kg").tag(false); Text("磅 lb").tag(true) } }
            Section("訓練回饋") { Toggle("訓練音效", isOn: $trainingSounds); Text("完成一組、完成訓練與休息結束時播放短音效。觸覺回饋會持續保留。").font(.caption).foregroundStyle(.secondary) }
            Section("器材記憶") {
                if memories.isEmpty { Text("訓練時點選「器材記憶」，保存座椅高度、握把與技術提示。").foregroundStyle(.secondary) }
                ForEach(memories) { memory in VStack(alignment: .leading, spacing: 6) { Text(memory.exercise).font(.headline); Text(memory.gym).font(.caption).foregroundStyle(IronStyle.vermilion); Text(memory.cue).font(.subheadline).foregroundStyle(.secondary) } }
            }
            Section("你的資料") { Button { exporting = true } label: { Label("匯出完整訓練 CSV", systemImage: "square.and.arrow.up") }; Text("訓練保存在此裝置。Apple Health 資料僅供你查看，不包含於訓練匯出中。").font(.caption).foregroundStyle(.secondary) }
            Section { LabeledContent("IRONLOG", value: "原生 iOS · 1.0"); Text("個人訓練記錄").foregroundStyle(.secondary) }
        }.navigationTitle("設定")
        .fileExporter(isPresented: $exporting, document: CSVDocument(text: IronUnits.csv(sessions)), contentType: .commaSeparatedText, defaultFilename: "IronLog-workouts") { result in if case .failure(let error) = result { exportError = error.localizedDescription } }
        .alert("匯出失敗", isPresented: Binding(get: { exportError != nil }, set: { if !$0 { exportError = nil } })) { Button("好") {} } message: { Text(exportError ?? "") }
    }
}
