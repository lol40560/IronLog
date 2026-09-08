import SwiftUI
import SwiftData

struct WorkoutPage: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Bindable var session: TrainingSession
    @Query private var memories: [EquipmentMemory]
    @AppStorage("pounds") private var pounds = false
    @State private var picker = false
    @State private var replacement: UUID?
    @State private var cueExercise: LoggedExercise?
    @State private var restEnd: Date?
    @State private var finish = false
    @State private var error: String?
    @State private var saveTemplate = false
    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HStack {
                    VStack(alignment: .leading, spacing: 5) { Label(session.gym, systemImage: "mappin.and.ellipse").font(.caption).foregroundStyle(.secondary); Text(session.started, style: .timer).font(.system(.title, design: .monospaced).bold()) }
                    Spacer(); Stamp(text: "\(session.completedSets) 組完成", prominent: session.completedSets > 0)
                }.paperPanel()
                if session.exercises.isEmpty { ContentUnavailableView("今天想練什麼？", systemImage: "dumbbell", description: Text("加入動作，設定重量與次數，完成後點右側勾選。")) }
                ForEach(session.exercises) { ex in
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            VStack(alignment: .leading, spacing: 5) { Text(ex.name).font(.title3.bold()); Text("\(ex.muscle) · \(ex.equipment)").font(.caption).foregroundStyle(.secondary) }
                            Spacer()
                            Menu {
                                Button("器材記憶", systemImage: "pin") { cueExercise = ex }
                                Button("替換動作", systemImage: "arrow.triangle.2.circlepath") { replacement = ex.id; picker = true }
                            } label: { Image(systemName: "ellipsis").padding(10) }
                        }
                        if let cue = memories.first(where: { $0.gym == session.gym && $0.exercise == ex.name }), !cue.cue.isEmpty {
                            Label(cue.cue, systemImage: "pin.fill").font(.caption).foregroundStyle(IronStyle.vermilion).frame(maxWidth: .infinity, alignment: .leading)
                        } else { Button { cueExercise = ex } label: { Label("器材記憶 · 記住座椅與握把", systemImage: "pin") }.font(.caption) }
                        HStack { Text("組別").frame(width: 42); Text(pounds ? "LB" : "KG").frame(maxWidth: .infinity); Text("次數").frame(maxWidth: .infinity); Text("完成").frame(width: 44) }.font(.caption).foregroundStyle(.secondary)
                        ForEach(Array(ex.sets.enumerated()), id: \.element.id) { index, set in
                            HStack(spacing: 10) {
                                Button(set.warmup ? "W" : "\(index + 1)") { update(ex.id, set.id) { $0.warmup.toggle() } }.frame(width: 42).foregroundStyle(set.warmup ? IronStyle.vermilion : Color.gray).accessibilityLabel("切換熱身組")
                                TextField("重量", value: Binding(get: { IronUnits.display(currentSet(ex.id, set.id)?.weight ?? 0, pounds: pounds) }, set: { value in update(ex.id, set.id) { $0.weight = IronUnits.kilograms(min(2000, max(0, value.isFinite ? value : 0)), pounds: pounds) } }), format: .number.precision(.fractionLength(0...2)))
                                    .keyboardType(.decimalPad).multilineTextAlignment(.center).padding(10).background(set.done ? IronStyle.vermilion.opacity(0.12) : IronStyle.paperShadow.opacity(0.35), in: RoundedRectangle(cornerRadius: 6)).accessibilityLabel("\(ex.name) 第 \(index + 1) 組重量")
                                TextField("次數", value: Binding(get: { currentSet(ex.id, set.id)?.reps ?? 0 }, set: { value in update(ex.id, set.id) { $0.reps = min(999, max(0, value)) } }), format: .number)
                                    .keyboardType(.numberPad).multilineTextAlignment(.center).padding(10).background(set.done ? IronStyle.vermilion.opacity(0.12) : IronStyle.paperShadow.opacity(0.35), in: RoundedRectangle(cornerRadius: 6)).accessibilityLabel("\(ex.name) 第 \(index + 1) 組次數")
                                Button {
                                    update(ex.id, set.id) { value in if value.reps > 0 { value.done.toggle() } }
                                    if currentSet(ex.id, set.id)?.done == true { restEnd = .now.addingTimeInterval(120); WorkoutFeedback.shared.play(.setCompleted) }
                                } label: { Image(systemName: set.done ? "checkmark.seal.fill" : "circle").font(.title2).frame(width: 44, height: 44).foregroundStyle(set.done ? IronStyle.vermilion : Color.gray) }.accessibilityLabel("完成第 \(index + 1) 組")
                            }
                        }
                        Button { var all = session.exercises; if let i = all.firstIndex(where: { $0.id == ex.id }) { var set = all[i].sets.last ?? LoggedSet(); set.id = UUID(); set.done = false; all[i].sets.append(set); session.exercises = all; persist() } } label: { Label("新增一組", systemImage: "plus").frame(maxWidth: .infinity) }.buttonStyle(.bordered)
                    }.paperPanel()
                }
                Button { replacement = nil; picker = true } label: { Label("加入動作", systemImage: "plus.circle.fill").frame(maxWidth: .infinity).padding(10) }.buttonStyle(.borderedProminent).tint(IronStyle.vermilion)
                Button("另存目前動作為課表") { saveTemplate = true }.font(.subheadline).padding(.bottom, 20)
            }.padding(18)
        }.inkPage().navigationTitle(session.title).navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) { Button { if persist() { dismiss() } } label: { Image(systemName: "chevron.down") }.accessibilityLabel("收起並保留訓練") }
            ToolbarItem(placement: .topBarTrailing) { Button("完成") { finish = true }.disabled(session.completedSets == 0) }
            ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("收起鍵盤") { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) } }
        }
        .safeAreaInset(edge: .bottom) {
            if let end = restEnd {
                TimelineView(.periodic(from: .now, by: 1)) { timeline in
                    HStack {
                        Image(systemName: "timer"); Text(end > timeline.date ? "休息" : "準備下一組")
                        Spacer(); Text(formatClock(Int(max(0, end.timeIntervalSince(timeline.date))))).font(.system(.title3, design: .monospaced).bold())
                        Button("+30") { restEnd = max(end, .now).addingTimeInterval(30) }
                        Button { restEnd = nil } label: { Image(systemName: "xmark.circle.fill") }.accessibilityLabel("結束休息")
                    }.foregroundStyle(IronStyle.paper).padding(16).background(IronStyle.redGradient, in: RoundedRectangle(cornerRadius: 10)).padding(.horizontal, 16)
                    .onChange(of: end < timeline.date) { _, ended in if ended { WorkoutFeedback.shared.play(.restEnded); restEnd = nil } }
                }
            }
        }
        .sheet(isPresented: $picker) { ExercisePicker { exercise in
            var all = session.exercises
            if let replacement, let index = all.firstIndex(where: { $0.id == replacement }) { all[index] = exercise }
            else { all.append(exercise) }
            session.exercises = all; persist()
        } }
        .sheet(item: $cueExercise) { ex in MemoryEditor(gym: session.gym, exercise: ex.name) }
        .confirmationDialog("完成這次訓練？", isPresented: $finish, titleVisibility: .visible) { Button("儲存訓練") { session.ended = .now; if persist() { WorkoutFeedback.shared.play(.workoutCompleted); dismiss() } else { session.ended = nil } } } message: { Text("已完成 \(session.completedSets) 組。未勾選的組別不計入訓練量。") }
        .alert("另存課表", isPresented: $saveTemplate) { Button("儲存") { var exercises = session.exercises; for i in exercises.indices { for j in exercises[i].sets.indices { exercises[i].sets[j].done = false } }; context.insert(TrainingRoutine(title: session.title + " · 自訂", exercises: exercises)); persist() }; Button("取消", role: .cancel) {} } message: { Text("保留目前的動作替換、重量與組數，供下次使用。") }
        .alert("無法儲存", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) { Button("好") {} } message: { Text(error ?? "") }
    }
    func currentSet(_ exercise: UUID, _ set: UUID) -> LoggedSet? { session.exercises.first { $0.id == exercise }?.sets.first { $0.id == set } }
    func update(_ exercise: UUID, _ set: UUID, change: (inout LoggedSet) -> Void) {
        var all = session.exercises
        guard let i = all.firstIndex(where: { $0.id == exercise }), let j = all[i].sets.firstIndex(where: { $0.id == set }) else { return }
        change(&all[i].sets[j]); session.exercises = all; persist()
    }
    @discardableResult func persist() -> Bool { do { try context.save(); return true } catch { self.error = error.localizedDescription; return false } }
}

struct ExercisePicker: View {
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""
    let select: (LoggedExercise) -> Void
    var body: some View {
        NavigationStack {
            List {
                ForEach(exerciseLibrary.filter { search.isEmpty || "\($0.name) \($0.muscle) \($0.equipment)".localizedCaseInsensitiveContains(search) }) { ex in
                    Button { select(ex.logged); dismiss() } label: { HStack { VStack(alignment: .leading, spacing: 6) { Text(ex.name).foregroundStyle(.primary); Text("\(ex.muscle) · \(ex.equipment)").font(.caption).foregroundStyle(.secondary) }; Spacer(); Image(systemName: "plus.circle") } }
                }
                if !search.trimmingCharacters(in: .whitespaces).isEmpty { Button("新增自訂動作「\(search)」") { select(LoggedExercise(name: search.trimmingCharacters(in: .whitespaces), muscle: "自訂", equipment: "自訂")); dismiss() } }
            }.searchable(text: $search, prompt: "搜尋動作、肌群或器材").navigationTitle("動作資料庫")
            .toolbar { Button("關閉") { dismiss() } }
        }.preferredColorScheme(.dark).tint(IronStyle.vermilion)
    }
}
struct MemoryEditor: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @Query private var memories: [EquipmentMemory]
    let gym: String; let exercise: String
    @State private var cue = ""
    @State private var error: String?
    var body: some View {
        NavigationStack {
            Form {
                Section { Text(exercise).font(.headline); Label(gym, systemImage: "mappin.and.ellipse") }
                Section("下次訓練時固定顯示") { TextField("例如：座椅第 4 格、窄握把、肩胛下沉", text: $cue, axis: .vertical).lineLimit(4...8) }
                if let error { Text(error).foregroundStyle(.red) }
            }.navigationTitle("器材記憶").toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("儲存") {
                    if let memory = memories.first(where: { $0.gym == gym && $0.exercise == exercise }) { memory.cue = cue }
                    else { context.insert(EquipmentMemory(gym: gym, exercise: exercise, cue: cue)) }
                    do { try context.save(); dismiss() } catch { self.error = error.localizedDescription }
                } }
            }.onAppear { cue = memories.first { $0.gym == gym && $0.exercise == exercise }?.cue ?? "" }
        }.preferredColorScheme(.dark).tint(IronStyle.vermilion)
    }
}
struct RoutineEditor: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    var existing: TrainingRoutine?
    @State private var title = "我的課表"
    @State private var exercises: [LoggedExercise] = []
    @State private var picker = false
    @State private var error: String?
    var body: some View {
        List {
            Section("課表名稱") { TextField("名稱", text: $title) }
            Section("動作 · 滑動刪除，拖曳排序") {
                ForEach(exercises) { ex in VStack(alignment: .leading, spacing: 5) { Text(ex.name); Text("\(ex.sets.count) 組 · 訓練中可調整重量與次數").font(.caption).foregroundStyle(.secondary) } }
                .onDelete { exercises.remove(atOffsets: $0) }.onMove { exercises.move(fromOffsets: $0, toOffset: $1) }
                Button { picker = true } label: { Label("加入動作", systemImage: "plus") }
            }
            if let error { Text(error).foregroundStyle(.red) }
        }.navigationTitle(existing == nil ? "建立課表" : "編輯課表")
        .toolbar { EditButton(); Button("儲存") {
            let name = title.trimmingCharacters(in: .whitespacesAndNewlines)
            if let existing { existing.title = name; existing.exercises = exercises }
            else { context.insert(TrainingRoutine(title: name, exercises: exercises)) }
            do { try context.save(); dismiss() } catch { self.error = error.localizedDescription }
        }.disabled(exercises.isEmpty || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) }
        .onAppear { if let existing, exercises.isEmpty { title = existing.title; exercises = existing.exercises } }
        .sheet(isPresented: $picker) { ExercisePicker { exercises.append($0) } }
    }
}
